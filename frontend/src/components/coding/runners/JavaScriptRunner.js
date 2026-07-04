export class JavaScriptRunner {
  static async run(code) {
    return new Promise((resolve) => {
      let output = [];
      
      // Override console.log
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
      console.log = (...args) => {
        output.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
      };
      
      console.error = (...args) => {
        output.push('Error: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
      };
      
      console.warn = (...args) => {
        output.push('Warn: ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
      };

      try {
        // Use a function constructor to run the code in a slightly isolated scope
        const runCode = new Function(code);
        const result = runCode();
        
        // If there's a return value and nothing was logged, output the return value
        if (result !== undefined && output.length === 0) {
          output.push(typeof result === 'object' ? JSON.stringify(result) : String(result));
        }
      } catch (error) {
        output.push(`Runtime Error:\n${error.message}`);
      } finally {
        // Restore console
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
      }
      
      resolve(output.join('\n') || "Code executed successfully (no output).");
    });
  }
}
