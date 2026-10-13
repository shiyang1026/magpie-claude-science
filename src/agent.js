import { SCIENCE_ICON } from './icon.js';

// Magpie owns writing and restoring this file; this module performs no I/O.
export const agent = {
  id: 'claude-science',
  name: 'Claude Science',
  config: '~/.config/magpie/claude-science.json',
  format: 'json',
  model: 'model',
  dir: '/Applications/Claude Science.app',
  icon: SCIENCE_ICON,
};

export function connect({ gateway, model }) {
  return {
    gateway: gateway.url,
    key: gateway.key,
    displayName: model.name || model.id,
  };
}
