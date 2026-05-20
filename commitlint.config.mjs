export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 0: disable, 1: warn, 2: error
    // 日本語だとうまく動かないので無効化
    "subject-case": [0], // 足りなかったら追加しても良い
    "scope-enum": [
      2,
      "always",
      [
        "frontend",
        "ci",
        "infra",
        "tool",
      ],
    ],
  },
};
