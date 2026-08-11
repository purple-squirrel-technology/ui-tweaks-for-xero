import { toggleStateItem } from '../../lib/storage';
import { TOGGLES } from '../../lib/toggles';

async function render() {
  const container = document.getElementById('toggles');
  if (!container) return;

  const state = await toggleStateItem.getValue();

  container.replaceChildren(
    ...TOGGLES.map((toggle) => {
      const label = document.createElement('label');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(state[toggle.id]);
      checkbox.addEventListener('change', async () => {
        const current = await toggleStateItem.getValue();
        await toggleStateItem.setValue({
          ...current,
          [toggle.id]: checkbox.checked,
        });
      });

      label.appendChild(checkbox);
      label.append(toggle.label);
      return label;
    }),
  );
}

render();
