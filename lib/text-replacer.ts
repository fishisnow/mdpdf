export type TextReplaceOptions = {
  interpretFind: boolean;
  interpretReplace: boolean;
  caseSensitive: boolean;
  useRegex: boolean;
  greedy: boolean;
};

export type TextReplaceResult = {
  output: string;
  count: number;
  error?: string;
};

export function decodeEscapes(input: string): string {
  let output = "";
  for (let index = 0; index < input.length; index += 1) {
    const current = input[index];
    if (current !== "\\" || index === input.length - 1) {
      output += current;
      continue;
    }

    const next = input[index + 1];
    index += 1;
    if (next === "n") {
      output += "\n";
    } else if (next === "t") {
      output += "\t";
    } else if (next === "r") {
      output += "\r";
    } else if (next === "\\") {
      output += "\\";
    } else if (next === "0") {
      output += "\0";
    } else {
      output += `\\${next}`;
    }
  }
  return output;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Turn greedy quantifiers into lazy ones (`*`, `+`, `?`, `{n,m}`), leaving character classes and escapes alone. */
export function makeQuantifiersLazy(pattern: string): string {
  let output = "";
  let index = 0;
  let inClass = false;
  let escaped = false;

  const isLazyMarker = (position: number) => pattern[position] === "?";

  while (index < pattern.length) {
    const current = pattern[index];

    if (escaped) {
      output += current;
      escaped = false;
      index += 1;
      continue;
    }

    if (current === "\\") {
      output += current;
      escaped = true;
      index += 1;
      continue;
    }

    if (!inClass && current === "[") {
      inClass = true;
      output += current;
      index += 1;
      continue;
    }

    if (inClass) {
      if (current === "]") inClass = false;
      output += current;
      index += 1;
      continue;
    }

    if (current === "*" || current === "+") {
      output += `${current}?`;
      index += isLazyMarker(index + 1) ? 2 : 1;
      continue;
    }

    if (current === "{" && /^\{\d+(?:,\d*)?\}/.test(pattern.slice(index))) {
      const end = pattern.indexOf("}", index);
      output += `${pattern.slice(index, end + 1)}?`;
      index = end + 1;
      if (isLazyMarker(index)) index += 1;
      continue;
    }

    if (current === "?" && output[output.length - 1] !== "(") {
      output += "??";
      index += isLazyMarker(index + 1) ? 2 : 1;
      continue;
    }

    output += current;
    index += 1;
  }

  return output;
}

export function applyTextReplace(source: string, find: string, replace: string, options: TextReplaceOptions): TextReplaceResult {
  const replacement = options.interpretReplace ? decodeEscapes(replace) : replace;

  if (!find) {
    return { output: source, count: 0 };
  }

  try {
    if (options.useRegex) {
      const flags = options.caseSensitive ? "g" : "gi";
      const pattern = options.greedy ? find : makeQuantifiersLazy(find);
      const matches = Array.from(source.matchAll(new RegExp(pattern, flags)));
      return {
        output: source.replace(new RegExp(pattern, flags), replacement),
        count: matches.length,
      };
    }

    const needle = options.interpretFind ? decodeEscapes(find) : find;
    if (!needle) {
      return { output: source, count: 0 };
    }

    if (!options.caseSensitive) {
      const regex = new RegExp(escapeRegExp(needle), "gi");
      const matches = source.match(regex);
      return {
        output: source.replace(regex, replacement),
        count: matches?.length ?? 0,
      };
    }

    const parts = source.split(needle);
    return {
      output: parts.join(replacement),
      count: Math.max(0, parts.length - 1),
    };
  } catch (error) {
    return {
      output: source,
      count: 0,
      error: error instanceof Error ? error.message : "Invalid regular expression.",
    };
  }
}
