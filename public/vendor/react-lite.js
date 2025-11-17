// Lightweight React-compatible runtime for offline usage
const subscribers = new Set();
let rootContainer = null;
let rootElement = null;
let hookStates = [];
let hookIndex = 0;
let effectStates = [];
let pendingEffects = [];

function createElement(type, props, ...children) {
  return { type, props: props || {}, children: children.flat() };
}

function useState(initialValue) {
  const idx = hookIndex++;
  if (hookStates[idx] === undefined) {
    hookStates[idx] = typeof initialValue === 'function' ? initialValue() : initialValue;
  }
  const setState = (next) => {
    const value = typeof next === 'function' ? next(hookStates[idx]) : next;
    if (value === hookStates[idx]) return;
    hookStates[idx] = value;
    rerender();
  };
  return [hookStates[idx], setState];
}

function useEffect(effect, deps) {
  const idx = hookIndex++;
  const prev = effectStates[idx];
  const hasChanged =
    !prev || !deps || !prev.deps || deps.length !== prev.deps.length || deps.some((d, i) => d !== prev.deps[i]);
  effectStates[idx] = { effect, deps, cleanup: prev?.cleanup };
  if (hasChanged) {
    pendingEffects.push(idx);
  }
}

function flushEffects() {
  pendingEffects.forEach((idx) => {
    const record = effectStates[idx];
    if (!record) return;
    if (typeof record.cleanup === 'function') {
      record.cleanup();
    }
    record.cleanup = record.effect?.();
  });
  pendingEffects = [];
}

function setProps(dom, props) {
  Object.entries(props || {}).forEach(([key, value]) => {
    if (key === 'children' || value === undefined || value === null) return;
    if (key === 'className') {
      dom.setAttribute('class', value);
      return;
    }
    if (key === 'style' && typeof value === 'object') {
      Object.assign(dom.style, value);
      return;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      dom.addEventListener(event, value);
      return;
    }
    if (key === 'value') {
      dom.value = value;
      return;
    }
    if (typeof value === 'boolean') {
      if (key === 'checked') dom.checked = value;
      if (key === 'disabled') dom.disabled = value;
      if (value) {
        dom.setAttribute(key, '');
      } else {
        dom.removeAttribute(key);
      }
      return;
    }
    dom.setAttribute(key, value);
  });
}

function renderVNode(vnode) {
  if (vnode === null || vnode === undefined || typeof vnode === 'boolean') return document.createTextNode('');
  if (typeof vnode === 'string' || typeof vnode === 'number') return document.createTextNode(String(vnode));
  if (Array.isArray(vnode)) {
    const fragment = document.createDocumentFragment();
    vnode.forEach((child) => fragment.appendChild(renderVNode(child)));
    return fragment;
  }
  if (typeof vnode.type === 'function') {
    const component = vnode.type;
    const prevHookIndex = hookIndex;
    const prevPending = pendingEffects;
    hookIndex = 0;
    pendingEffects = [];
    const rendered = component({ ...(vnode.props || {}), children: vnode.children });
    const dom = renderVNode(rendered);
    flushEffects();
    hookIndex = prevHookIndex + hookIndex;
    pendingEffects = prevPending.concat(pendingEffects);
    return dom;
  }
  const dom = document.createElement(vnode.type);
  setProps(dom, vnode.props || {});
  (vnode.children || []).forEach((child) => dom.appendChild(renderVNode(child)));
  return dom;
}

function rerender() {
  if (!rootContainer || !rootElement) return;
  const active = document.activeElement;
  const focusId = active?.getAttribute('data-focus-id') || active?.getAttribute('name') || active?.id || null;
  const selection =
    active && 'selectionStart' in active
      ? { start: active.selectionStart, end: active.selectionEnd, direction: active.selectionDirection }
      : null;

  hookIndex = 0;
  pendingEffects = [];
  const dom = renderVNode(rootElement);
  rootContainer.innerHTML = '';
  rootContainer.appendChild(dom);
  flushEffects();

  if (focusId) {
    const next = rootContainer.querySelector(`[data-focus-id="${focusId}"]`) ||
      rootContainer.querySelector(`[name="${focusId}"]`) ||
      (focusId ? rootContainer.querySelector(`#${focusId}`) : null);
    if (next && typeof next.focus === 'function') {
      next.focus();
      if (selection && 'setSelectionRange' in next) {
        try {
          next.setSelectionRange(selection.start, selection.end, selection.direction || 'none');
        } catch (_) {
          /* ignore if input type does not support selection */
        }
      }
    }
  }

  subscribers.forEach((fn) => fn());
}

function createRoot(container) {
  rootContainer = container;
  return {
    render(element) {
      rootElement = element;
      rerender();
    },
    unmount() {
      rootContainer.innerHTML = '';
      rootElement = null;
      hookStates = [];
      effectStates = [];
      hookIndex = 0;
    }
  };
}

export const React = { createElement, useState, useEffect };
export const ReactDOM = { createRoot };
export function subscribeRender(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
