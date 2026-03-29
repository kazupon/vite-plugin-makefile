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
}
