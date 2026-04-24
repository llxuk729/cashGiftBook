export const RELATIONSHIP_META = {
  self: {
    label: "自己",
    icon: "🪞",
    branch: "core",
    keywords: ["自己", "本人", "我"],
  },
  father: {
    label: "父亲",
    icon: "👨",
    branch: "core",
    keywords: ["父亲", "爸爸", "爸"],
  },
  mother: {
    label: "母亲",
    icon: "👩",
    branch: "core",
    keywords: ["母亲", "妈妈", "妈"],
  },
  husband: {
    label: "丈夫",
    icon: "🤵",
    branch: "spouse",
    keywords: ["丈夫", "老公", "先生"],
  },
  wife: {
    label: "妻子",
    icon: "👰",
    branch: "spouse",
    keywords: ["妻子", "老婆", "太太"],
  },
  older_brother: {
    label: "哥哥",
    icon: "🧑",
    branch: "siblings",
    keywords: ["哥哥", "哥"],
  },
  younger_brother: {
    label: "弟弟",
    icon: "👦",
    branch: "siblings",
    keywords: ["弟弟", "弟"],
  },
  older_sister: {
    label: "姐姐",
    icon: "👩",
    branch: "siblings",
    keywords: ["姐姐", "姐"],
  },
  younger_sister: {
    label: "妹妹",
    icon: "👧",
    branch: "siblings",
    keywords: ["妹妹", "妹"],
  },
  son: { label: "儿子", icon: "👦", branch: "children", keywords: ["儿子"] },
  daughter: {
    label: "女儿",
    icon: "👧",
    branch: "children",
    keywords: ["女儿"],
  },
  grandfather: {
    label: "爷爷",
    icon: "👴",
    branch: "paternal",
    keywords: ["爷爷", "祖父"],
  },
  grandmother: {
    label: "奶奶",
    icon: "👵",
    branch: "paternal",
    keywords: ["奶奶", "祖母"],
  },
  maternal_grandfather: {
    label: "外公",
    icon: "👴",
    branch: "maternal",
    keywords: ["外公", "姥爷"],
  },
  maternal_grandmother: {
    label: "外婆",
    icon: "👵",
    branch: "maternal",
    keywords: ["外婆", "姥姥"],
  },
  uncle: {
    label: "叔叔",
    icon: "🧔",
    branch: "paternal",
    keywords: ["叔叔", "叔"],
  },
  aunt: {
    label: "阿姨",
    icon: "👩",
    branch: "maternal",
    keywords: ["阿姨", "姨", "姑姑"],
  },
  maternal_uncle: {
    label: "舅舅",
    icon: "🧔",
    branch: "maternal",
    keywords: ["舅舅", "舅"],
  },
  maternal_aunt: {
    label: "姨妈",
    icon: "👩",
    branch: "maternal",
    keywords: ["姨妈", "阿姨", "姨"],
  },
  paternal_cousin: {
    label: "堂亲",
    icon: "🧑",
    branch: "paternal",
    keywords: ["堂兄弟", "堂姐", "堂妹", "堂哥"],
  },
  maternal_cousin: {
    label: "表亲",
    icon: "🧑",
    branch: "maternal",
    keywords: ["表兄弟", "表姐", "表妹", "表哥"],
  },
  friend: { label: "朋友", icon: "🤝", branch: "social", keywords: ["朋友"] },
  colleague: {
    label: "同事",
    icon: "💼",
    branch: "social",
    keywords: ["同事"],
  },
  classmate: {
    label: "同学",
    icon: "🎒",
    branch: "social",
    keywords: ["同学"],
  },
};

export const RELATIONSHIP_OPTIONS = [
  "father",
  "mother",
  "husband",
  "wife",
  "older_brother",
  "younger_brother",
  "older_sister",
  "younger_sister",
  "son",
  "daughter",
  "grandfather",
  "grandmother",
  "maternal_grandfather",
  "maternal_grandmother",
  "uncle",
  "aunt",
  "maternal_uncle",
  "maternal_aunt",
  "friend",
  "colleague",
  "classmate",
];

export const RELATIONSHIP_GROUPS = [
  { key: "core", label: "直系常用", icon: "✨" },
  { key: "siblings", label: "兄弟姐妹", icon: "👪" },
  { key: "children", label: "晚辈", icon: "🌱" },
  { key: "paternal", label: "父系亲属", icon: "🏠" },
  { key: "maternal", label: "母系亲属", icon: "🌷" },
  { key: "spouse", label: "配偶相关", icon: "💍" },
  { key: "social", label: "亲友同事", icon: "🎉" },
];

export function getRelationshipLabel(type) {
  return RELATIONSHIP_META[type]?.label || type || "";
}

export function getRelationshipIcon(type) {
  return RELATIONSHIP_META[type]?.icon || "👤";
}

export function getRelationshipOptionsByGroup() {
  return RELATIONSHIP_GROUPS.map((group) => ({
    ...group,
    items: RELATIONSHIP_OPTIONS.filter(
      (type) => RELATIONSHIP_META[type]?.branch === group.key,
    ).map((type) => ({
      type,
      label: getRelationshipLabel(type),
      icon: getRelationshipIcon(type),
    })),
  })).filter((group) => group.items.length > 0);
}

export function searchRelationshipOptions(keyword) {
  const normalized = (keyword || "").trim().toLowerCase();
  if (!normalized) {
    return RELATIONSHIP_OPTIONS.map((type) => ({
      type,
      label: getRelationshipLabel(type),
      icon: getRelationshipIcon(type),
    }));
  }

  return RELATIONSHIP_OPTIONS.filter((type) => {
    const meta = RELATIONSHIP_META[type];
    if (!meta) return false;

    return [meta.label, type, ...(meta.keywords || [])]
      .filter(Boolean)
      .some((word) => word.toLowerCase().includes(normalized));
  }).map((type) => ({
    type,
    label: getRelationshipLabel(type),
    icon: getRelationshipIcon(type),
  }));
}
