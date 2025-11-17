export function el(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

export function clear(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function renderInto(element, node) {
  clear(element);
  element.appendChild(node);
}
