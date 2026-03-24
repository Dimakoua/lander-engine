export type ComponentMap = Record<string, any>;
export type ActionHandler = (payload: any) => void | Promise<void>;
export type ActionMap = Record<string, ActionHandler>;

class Registry {
  private components: ComponentMap = {};
  private actions: ActionMap = {};

  registerComponent(name: string, component: any) {
    this.components[name] = component;
  }

  registerComponents(components: ComponentMap) {
    this.components = { ...this.components, ...components };
  }

  getComponent(name: string) {
    return this.components[name];
  }

  registerAction(name: string, handler: ActionHandler) {
    this.actions[name] = handler;
  }

  registerActions(actions: ActionMap) {
    this.actions = { ...this.actions, ...actions };
  }

  getAction(name: string) {
    return this.actions[name];
  }

  getAllComponents() {
    return this.components;
  }

  getAllActions() {
    return this.actions;
  }
}

export const registry = new Registry();
