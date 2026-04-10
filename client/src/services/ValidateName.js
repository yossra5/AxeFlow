// client/src/services/ValidateName.js
export function parseName(name) {
  const match = name.match(/^(.*?)(\s+(\d+))?$/);
  if (match && match[3] !== undefined) {
    return { base: match[1].trim(), num: parseInt(match[3], 10) };
  }
  return { base: name.trim(), num: null };
}

export function validateName(desiredName, existingNames) {
  const trimmed = desiredName.trim();
  if (!trimmed) return "Unnamed Node";
  if (!existingNames.includes(trimmed)) return trimmed;

  const { base } = parseName(trimmed);
  let maxNum = 0;
  for (const name of existingNames) {
    const parsed = parseName(name);
    if (parsed.base === base) {
      const n = parsed.num ?? 0;
      if (n > maxNum) maxNum = n;
    }
  }
  return `${base} ${maxNum + 1}`;
}

export function getOtherNames(nodes, excludeId) {
  return nodes.filter((n) => n.id !== excludeId).map((n) => n.data.label);
}
