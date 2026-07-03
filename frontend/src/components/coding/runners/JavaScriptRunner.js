export class JavaScriptRunner {
  static async run(code) {
    return new Promise((resolve) => {
      let output = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleInfo = console.info;

      const captureLog = (...args) => {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        output.push(msg);
      };

      console.log = captureLog;
      console.error = captureLog;
      console.warn = captureLog;
      console.info = captureLog;

      try {
        // Execute the code using a new Function to provide basic scoping
        const executor = new Function(code);
        executor();
      } catch (error) {
        output.push(`Error: ${error.message}`);
      } finally {
        // Restore console
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.info = originalConsoleInfo;
        
        resolve(output.join('\n'));
      }
    });
  }
}
