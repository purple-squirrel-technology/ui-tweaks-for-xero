import { toggleStateItem } from '@/lib/storage.ts';
import { FLYOUTS } from '@/lib/flyouts.ts';
import { MENU_ITEMS } from '@/lib/menu-items.ts';
import { TOGGLES } from '@/lib/toggles.ts';

function makeToggleLabel(
  id: string,
  label: string,
  state: Record<string, boolean>,
): HTMLLabelElement {
  const labelEl = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = Boolean(state[id]);
  checkbox.addEventListener('change', async () => {
    const current = await toggleStateItem.getValue();
    await toggleStateItem.setValue({ ...current, [id]: checkbox.checked });
  });
  labelEl.appendChild(checkbox);
  labelEl.append(label);
  return labelEl;
}

async function render() {
  const container = document.getElementById('toggles');
  if (!container) return;

  const state = await toggleStateItem.getValue();
  const children: Node[] = [];

  if (TOGGLES.length > 0) {
    const heading = document.createElement('h2');
    heading.textContent = 'Element styles';
    children.push(heading);
    for (const t of TOGGLES) children.push(makeToggleLabel(t.id, t.label, state));
  }

  if (FLYOUTS.length > 0) {
    const heading = document.createElement('h2');
    heading.textContent = 'Menu flyouts';
    children.push(heading);
    for (const f of FLYOUTS) children.push(makeToggleLabel(f.id, f.label, state));
  }

  if (MENU_ITEMS.length > 0) {
    const heading = document.createElement('h2');
    heading.textContent = 'Menu items';
    children.push(heading);
    for (const m of MENU_ITEMS) children.push(makeToggleLabel(m.id, m.label, state));
  }

  container.replaceChildren(...children);
}

render();
