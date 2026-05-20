export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "scope-enum": [
      2,
      "always",
      [
        "frontend",
        "ci",
        "infra",
        "tool",
        "vrc-ta-hub-client",
      ],
    ],
  },
};
