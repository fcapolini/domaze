
export const SRC_LOGIC_ATTR_PREFIX = ':';
export const SRC_SYS_ATTR_PREFIX = 'node:';
export const SRC_ATTR_NAME_REGEX = /^:{0,2}[a-zA-Z_][a-zA-Z0-9_$-]*$/;

export const SRC_NAME_ATTR = SRC_SYS_ATTR_PREFIX + 'name';
export const SRC_EVENT_ATTR_PREFIX = 'on:';

export const DEF_NODE_NAMES: { [key: string]: string } = {
  HTML: 'page',
  HEAD: 'head',
  BODY: 'body'
};
