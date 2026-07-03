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
        
        pyodideInstance = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
        });
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
      
      // Redirect stdout and stderr to capture print statements
      await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
      `);

      await pyodide.runPythonAsync(code);
      
      const stdout = pyodide.runPython("sys.stdout.getvalue()");
      const stderr = pyodide.runPython("sys.stderr.getvalue()");
      
      let finalOutput = stdout;
      if (stderr) {
        finalOutput += "\nError: " + stderr;
      }
      
      return finalOutput.trim() || "Code executed successfully (no output).";
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
