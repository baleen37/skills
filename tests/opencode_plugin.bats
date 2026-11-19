#!/usr/bin/env bats

load helpers/bats_helper

setup() {
    ensure_jq
}

@test "package.json has no script that triggers Git dependency preparation" {
    # OpenCode installs the plugin as a Git dependency; any of these scripts
    # makes npm run a preparation step that fails inside OpenCode.
    local found
    found="$(jq -r '.scripts // {} | keys[] | select(test("^(pre|post)?install$|^prepare$|^build$|^prepack$"))' "${PROJECT_ROOT}/package.json")"
    [ -z "$found" ]
}

@test "OpenCode plugin registers every core and wiki skill" {
    run node --input-type=module -e '
        const plugin = await import(process.argv[1]);
        const skills = plugin.loadSkills();
        let added = [];
        await plugin.default.setup({ skill: { transform: (fn) => fn({ add: (s) => added.push(s) }) } });
        const bad = added.filter((s) => !s.id || !s.name || !s.description || !s.path || !s.content);
        console.log(plugin.default.id, added.length, skills.length, bad.map((s) => s.id).join(","));
    ' "${PROJECT_ROOT}/index.js"
    [ "$status" -eq 0 ]

    local expected
    expected="$(find "${PROJECT_ROOT}"/plugins/{core,wiki}/skills -mindepth 2 -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')"
    [ "$output" = "baleen-skills ${expected} ${expected} " ]
}
