// Demo mode communicates with pages via custom events
export type DemoAction =
  | { type: 'FILL_PERSONAL'; data: any }
  | { type: 'NEXT_STEP' }
  | { type: 'FILL_ADDRESS'; data: any }
  | { type: 'FILL_DEBTS'; data: any }
  | { type: 'FILL_INCOME'; data: any }
  | { type: 'FILL_EXPENDITURE'; data: any }
  | { type: 'FILL_ASSETS'; data: any }
  | { type: 'RUN_CHECKS' }
  | { type: 'SUBMIT' }
  | { type: 'SCROLL_TO'; selector: string }
  | { type: 'APPROVE_CASE' }
  | { type: 'UPLOAD_DOCUMENT'; data: { filename: string; size: number } }
  | { type: 'CLICK_RECOMMEND' }
  | { type: 'DOWNLOAD_PDF' }
  | { type: 'SELECT_PAYMENT'; method: string }
  | { type: 'CONFIRM_PAYMENT' };

export function dispatchDemoAction(action: DemoAction) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('iaas-demo-action', { detail: action }));
  }
}

export function onDemoAction(callback: (action: DemoAction) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => callback((e as CustomEvent).detail);
  window.addEventListener('iaas-demo-action', handler);
  return () => window.removeEventListener('iaas-demo-action', handler);
}
