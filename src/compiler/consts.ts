
export const SRC_LOGIC_ATTR_PREFIX = ':';
export const SRC_SYS_VALUE_PREFIX = SRC_LOGIC_ATTR_PREFIX + ':';
export const SRC_NAME_ATTR = SRC_SYS_VALUE_PREFIX + 'name';

export const SRC_DEF_SCOPE_NAMES: { [key: string]: string } = {
  HTML: 'page',
  HEAD: 'head',
  BODY: 'body'
};

export const CLIENT_CODE_SRC = '../client.js';
export const CLIENT_CODE_REQ = '/.pagelogic.js';

export const CLIENT_PROPS_SCRIPT_ID = 'pl-props';
export const CLIENT_PROPS_SCRIPT_GLOBAL = '__pagelogicProps__';
export const CLIENT_CODE_SCRIPT_ID = 'pl-client';
export const CLIENT_DEFAULT_GLOBAL = 'logic';
