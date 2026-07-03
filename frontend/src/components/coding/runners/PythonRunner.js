let pyodideInstance = null;
let isLoading = false;
let initPromise = null;

export class PythonRunner {
  static async init() {
    if (pyodideInstance) return pyodideInstance;
    if (isLoading) return initPromise;

    isLoading = true;
    initPromise = new Promise(async (resolve, reject) => {
      try {
        // Dynamically load the Pyodide script
        if (!window.loadPyodide) {
          await new Promise((res, rej) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
            script.onload = res;
            script.onerror = () => rej(new Error('Failed to load Pyodide CDN'));
            document.head.appendChild(script);
          });
        }
        
        pyodideInstance = await window.loadPyodide();
        resolve(pyodideInstance);
      } catch (error) {
        reject(error);
      } finally {
        isLoading = false;
      }
    });

    return initPromise;
  }

  static async run(code) {
    try {
      const pyodide = await this.init();
      
      // We need to capture stdout
      let output = [];
      pyodide.setStdout({ batched: (msg) => output.push(msg) });
      pyodide.setStderr({ batched: (msg) => output.push(`Error: ${msg}`) });

      await pyodide.runPythonAsync(code);
      return output.join('\n');
    } catch (error) {
      return `Runtime Error:\n${error.message}`;
    }
  }

  static async reset() {
    pyodideInstance = null;
    isLoading = false;
    initPromise = null;
    await this.init();
    return "Python environment has been successfully restarted.";
  }
}
