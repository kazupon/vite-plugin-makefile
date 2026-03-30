use makefile_lossless::Makefile;
use napi_derive::napi;

#[napi(object)]
pub struct MakefileTarget {
    pub name: String,
    pub prerequisites: Vec<String>,
    pub is_phony: bool,
}

pub fn parse_makefile_inner(content: &str) -> Vec<MakefileTarget> {
    let mf: Makefile = match content.parse() {
        Ok(mf) => mf,
        Err(_) => return Vec::new(),
    };

    let phony_targets: std::collections::HashSet<String> = mf
        .rules()
        .filter(|rule| rule.targets().any(|t| t.to_string() == ".PHONY"))
        .flat_map(|rule| rule.prerequisites().map(|p| p.to_string()))
        .collect();

    mf.rules()
        .flat_map(|rule| {
            let prerequisites: Vec<String> = rule.prerequisites().map(|p| p.to_string()).collect();
            let phony_ref = &phony_targets;
            rule.targets()
                .filter(|t| t.to_string() != ".PHONY")
                .map(move |target| {
                    let name = target.to_string();
                    MakefileTarget {
                        is_phony: phony_ref.contains(&name),
                        name,
                        prerequisites: prerequisites.clone(),
                    }
                })
                .collect::<Vec<_>>()
        })
        .collect()
}

#[napi]
pub fn parse_makefile(content: String) -> Vec<MakefileTarget> {
    parse_makefile_inner(&content)
}

#[napi(object)]
pub struct TaskDefinition {
    pub name: String,
    pub command: String,
    pub cwd: Option<String>,
    pub depends_on: Option<Vec<String>>,
    pub cache: bool,
    pub input: Vec<String>,
}

#[napi(object)]
pub struct TransformOptions {
    pub dir: String,
    pub exclude: Vec<String>,
    pub prefix: String, // "directory" or "none"
    pub cache: bool,
}

pub fn transform_makefile_tasks_inner(
    content: &str,
    options: &TransformOptions,
) -> Vec<TaskDefinition> {
    let targets = parse_makefile_inner(content);
    let phony_targets: Vec<&MakefileTarget> = targets.iter().filter(|t| t.is_phony).collect();
    let phony_names: std::collections::HashSet<&str> =
        phony_targets.iter().map(|t| t.name.as_str()).collect();
    let is_root = options.dir == ".";

    let mut tasks = Vec::new();

    for target in &phony_targets {
        if options.exclude.iter().any(|e| e == &target.name) {
            continue;
        }

        let task_name =
            resolve_task_name_inner(&options.dir, &target.name, &options.prefix, is_root);
        let phony_deps: Vec<String> = target
            .prerequisites
            .iter()
            .filter(|p| phony_names.contains(p.as_str()))
            .map(|dep| resolve_task_name_inner(&options.dir, dep, &options.prefix, is_root))
            .collect();

        let depends_on = if phony_deps.is_empty() {
            None
        } else {
            Some(phony_deps)
        };

        let cwd = if is_root {
            None
        } else {
            Some(options.dir.clone())
        };

        tasks.push(TaskDefinition {
            name: task_name,
            command: format!("make {}", target.name),
            cwd,
            depends_on,
            cache: options.cache,
            input: vec!["Makefile".to_string()],
        });
    }

    tasks
}

fn resolve_task_name_inner(dir: &str, target: &str, prefix: &str, is_root: bool) -> String {
    if prefix == "none" || is_root {
        target.to_string()
    } else {
        format!("{}/{}", dir, target)
    }
}

#[napi]
pub fn transform_makefile_tasks_native(
    content: String,
    options: TransformOptions,
) -> Vec<TaskDefinition> {
    transform_makefile_tasks_inner(&content, &options)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_input() {
        let targets = parse_makefile_inner("");
        assert!(targets.is_empty());
    }

    #[test]
    fn test_simple_phony_targets() {
        let content = "\
.PHONY: build test clean

build:
\tgcc -o app src/*.c

test: build
\t./run_tests

clean:
\trm -rf dist
";
        let targets = parse_makefile_inner(content);

        assert_eq!(targets.len(), 3);

        let build = targets.iter().find(|t| t.name == "build").unwrap();
        assert!(build.is_phony);
        assert!(build.prerequisites.is_empty());

        let test = targets.iter().find(|t| t.name == "test").unwrap();
        assert!(test.is_phony);
        assert_eq!(test.prerequisites, vec!["build"]);

        let clean = targets.iter().find(|t| t.name == "clean").unwrap();
        assert!(clean.is_phony);
        assert!(clean.prerequisites.is_empty());
    }

    #[test]
    fn test_non_phony_targets() {
        let content = "\
app: main.o utils.o
\tgcc -o app main.o utils.o
";
        let targets = parse_makefile_inner(content);

        assert_eq!(targets.len(), 1);
        assert_eq!(targets[0].name, "app");
        assert!(!targets[0].is_phony);
        assert_eq!(targets[0].prerequisites, vec!["main.o", "utils.o"]);
    }

    #[test]
    fn test_mixed_phony_and_file_targets() {
        let content = "\
.PHONY: clean

clean:
\trm -rf dist

app: main.c
\tgcc -o app main.c
";
        let targets = parse_makefile_inner(content);

        assert_eq!(targets.len(), 2);

        let clean = targets.iter().find(|t| t.name == "clean").unwrap();
        assert!(clean.is_phony);

        let app = targets.iter().find(|t| t.name == "app").unwrap();
        assert!(!app.is_phony);
    }

    #[test]
    fn test_multiple_phony_declarations() {
        let content = "\
.PHONY: build
.PHONY: test

build:
\techo build

test:
\techo test
";
        let targets = parse_makefile_inner(content);

        assert_eq!(targets.len(), 2);
        assert!(targets.iter().all(|t| t.is_phony));
    }

    #[test]
    fn test_prerequisites_preserved() {
        let content = "\
.PHONY: all build test

all: build test
\techo done

build:
\techo build

test: build
\techo test
";
        let targets = parse_makefile_inner(content);

        let all = targets.iter().find(|t| t.name == "all").unwrap();
        assert_eq!(all.prerequisites, vec!["build", "test"]);

        let test = targets.iter().find(|t| t.name == "test").unwrap();
        assert_eq!(test.prerequisites, vec!["build"]);
    }

    #[test]
    fn test_invalid_makefile() {
        let targets = parse_makefile_inner("this is not a valid makefile @#$%");
        // Should not panic, may return empty or partial results
        let _ = targets;
    }

    fn make_options(dir: &str, exclude: &[&str], prefix: &str, cache: bool) -> TransformOptions {
        TransformOptions {
            dir: dir.to_string(),
            exclude: exclude.iter().map(|s| s.to_string()).collect(),
            prefix: prefix.to_string(),
            cache,
        }
    }

    #[test]
    fn test_transform_simple_root() {
        let content = "\
.PHONY: build test clean setup

build: setup
\tgcc -o app src/*.c

test: build
\t./run_tests

clean:
\trm -rf dist

setup:
\t./bootstrap.sh
";
        let opts = make_options(".", &[], "directory", true);
        let tasks = transform_makefile_tasks_inner(content, &opts);

        assert_eq!(tasks.len(), 4);

        let build = tasks.iter().find(|t| t.name == "build").unwrap();
        assert_eq!(build.command, "make build");
        assert!(build.cwd.is_none());
        assert_eq!(build.depends_on, Some(vec!["setup".to_string()]));
        assert!(build.cache);
        assert_eq!(build.input, vec!["Makefile"]);

        let test = tasks.iter().find(|t| t.name == "test").unwrap();
        assert_eq!(test.command, "make test");
        assert_eq!(test.depends_on, Some(vec!["build".to_string()]));

        let clean = tasks.iter().find(|t| t.name == "clean").unwrap();
        assert_eq!(clean.command, "make clean");
        assert!(clean.depends_on.is_none());

        let setup = tasks.iter().find(|t| t.name == "setup").unwrap();
        assert_eq!(setup.command, "make setup");
        assert!(setup.depends_on.is_none());
    }

    #[test]
    fn test_transform_non_root_directory_prefix() {
        let content = "\
.PHONY: docker-up docker-down migrate

docker-up:
\tdocker compose up -d

docker-down:
\tdocker compose down

migrate: docker-up
\t./run_migration.sh
";
        let opts = make_options("infra", &[], "directory", true);
        let tasks = transform_makefile_tasks_inner(content, &opts);

        assert_eq!(tasks.len(), 3);

        let up = tasks.iter().find(|t| t.name == "infra/docker-up").unwrap();
        assert_eq!(up.command, "make docker-up");
        assert_eq!(up.cwd, Some("infra".to_string()));
        assert!(up.depends_on.is_none());

        let migrate = tasks.iter().find(|t| t.name == "infra/migrate").unwrap();
        assert_eq!(migrate.command, "make migrate");
        assert_eq!(migrate.cwd, Some("infra".to_string()));
        assert_eq!(
            migrate.depends_on,
            Some(vec!["infra/docker-up".to_string()])
        );
    }

    #[test]
    fn test_transform_prefix_none() {
        let content = "\
.PHONY: deploy

deploy:
\t./deploy.sh
";
        let opts = make_options("infra", &[], "none", true);
        let tasks = transform_makefile_tasks_inner(content, &opts);

        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].name, "deploy");
        assert_eq!(tasks[0].cwd, Some("infra".to_string()));
    }

    #[test]
    fn test_transform_exclude() {
        let content = "\
.PHONY: build test clean setup

build: setup
\tgcc -o app src/*.c

test: build
\t./run_tests

clean:
\trm -rf dist

setup:
\t./bootstrap.sh
";
        let opts = make_options(".", &["clean", "setup"], "directory", true);
        let tasks = transform_makefile_tasks_inner(content, &opts);

        assert_eq!(tasks.len(), 2);
        let names: Vec<&str> = tasks.iter().map(|t| t.name.as_str()).collect();
        assert!(names.contains(&"build"));
        assert!(names.contains(&"test"));
        assert!(!names.contains(&"clean"));
        assert!(!names.contains(&"setup"));
    }

    #[test]
    fn test_transform_cache_disabled() {
        let content = "\
.PHONY: build

build:
\techo build
";
        let opts = make_options(".", &[], "directory", false);
        let tasks = transform_makefile_tasks_inner(content, &opts);

        assert_eq!(tasks.len(), 1);
        assert!(!tasks[0].cache);
    }

    #[test]
    fn test_transform_only_phony_targets() {
        let content = "\
.PHONY: clean

clean:
\trm -rf dist

app: main.c
\tgcc -o app main.c
";
        let opts = make_options(".", &[], "directory", true);
        let tasks = transform_makefile_tasks_inner(content, &opts);

        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].name, "clean");
    }

    #[test]
    fn test_transform_depends_on_only_phony_prerequisites() {
        let content = "\
.PHONY: build test

build: src/main.c setup
\tgcc -o app src/main.c

test: build
\t./run_tests
";
        // setup is not .PHONY, src/main.c is a file — neither should be in depends_on
        let opts = make_options(".", &[], "directory", true);
        let tasks = transform_makefile_tasks_inner(content, &opts);

        let build = tasks.iter().find(|t| t.name == "build").unwrap();
        // setup and src/main.c are not phony, so depends_on should be None
        assert!(build.depends_on.is_none());

        let test = tasks.iter().find(|t| t.name == "test").unwrap();
        assert_eq!(test.depends_on, Some(vec!["build".to_string()]));
    }

    #[test]
    fn test_transform_empty_input() {
        let opts = make_options(".", &[], "directory", true);
        let tasks = transform_makefile_tasks_inner("", &opts);
        assert!(tasks.is_empty());
    }
}
