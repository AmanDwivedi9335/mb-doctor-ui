import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** A single rounded outline that joins the selected toggle to its panel. */
export function TabFrame({ children, value }: { children: ReactNode; value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [outline, setOutline] = useState("");
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const selected = element.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      const list = element.querySelector<HTMLElement>('[role="tablist"]');
      if (!selected || !list) return;
      const bounds = element.getBoundingClientRect();
      const tab = selected.getBoundingClientRect();
      const w = bounds.width - 0.5, h = bounds.height - 0.5;
      const t = list.getBoundingClientRect().height;
      const l = Math.max(0.5, tab.left - bounds.left), right = Math.min(w, tab.right - bounds.left);
      const r = Math.min(16, (right - l) / 4);
      const left = l > 1 ? `H ${l - r} Q ${l} ${t} ${l} ${t - r} V ${r} Q ${l} 0.5 ${l + r} 0.5` : `V ${r} Q 0.5 0.5 ${r} 0.5`;
      const end = right < w - 1 ? `H ${right - r} Q ${right} 0.5 ${right} ${r} V ${t - r} Q ${right} ${t} ${right + r} ${t} H ${w - r} Q ${w} ${t} ${w} ${t + r}` : `H ${w - r} Q ${w} 0.5 ${w} ${r}`;
      setOutline(`M 0.5 ${h - r} V ${t + r} ${l > 1 ? `Q 0.5 ${t} ${r} ${t}` : ""} ${left} ${end} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0.5 ${h} 0.5 ${h - r} Z`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const list = element.querySelector('[role="tablist"]');
    if (list) observer.observe(list);
    return () => observer.disconnect();
  }, [value]);
  return <div ref={ref} className="relative"><svg className="pointer-events-none absolute inset-0 z-10 size-full" aria-hidden="true"><path d={outline} fill="none" stroke="#b8b8b8" strokeWidth="1" /></svg>{children}</div>;
}
