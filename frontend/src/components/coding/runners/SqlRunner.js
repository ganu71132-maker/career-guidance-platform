let SQL = null;
let db = null;
let isLoading = false;
let initPromise = null;

export class SqlRunner {
  static async init() {
    if (db) return db;
    if (isLoading) return initPromise;

    isLoading = true;
    initPromise = new Promise(async (resolve, reject) => {
      try {
        if (!window.initSqlJs) {
          await new Promise((res, rej) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
            script.onload = res;
            script.onerror = () => rej(new Error('Failed to load SQL.js'));
            document.head.appendChild(script);
          });
        }

        SQL = await window.initSqlJs({
          locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        
        db = new SQL.Database();
        resolve(db);
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
      const database = await this.init();
      
      const results = database.exec(code);
      
      if (results.length === 0) {
        return { type: 'text', content: 'Command executed successfully.' };
      }

      // Format the result as an array of objects to render a table
      const formattedResults = results.map(result => {
        return {
          columns: result.columns,
          values: result.values
        };
      });

      return { type: 'table', content: formattedResults };
    } catch (error) {
      return { type: 'text', content: `Error:\n${error.message}` };
    }
  }

  static async reset() {
    if (db) {
      db.close();
    }
    db = null;
    isLoading = false;
    initPromise = null;
    await this.init();
    return { type: 'text', content: 'SQL Database has been successfully reset.' };
  }
}
