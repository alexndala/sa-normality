declare module 'plotly.js-basic-dist-min' {
  interface PlotlyApi {
    react(
      element: HTMLElement,
      data: unknown[],
      layout?: unknown,
      config?: unknown,
    ): Promise<unknown>;
    purge(element: HTMLElement): void;
    toImage(
      element: HTMLElement,
      options?: Record<string, unknown>,
    ): Promise<string>;
    Plots: {
      resize(element: HTMLElement): void;
    };
  }

  const Plotly: PlotlyApi;
  export default Plotly;
}
