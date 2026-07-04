import alasql from 'alasql';

export class SqlRunner {
  static async run(code) {
    return new Promise((resolve) => {
      try {
        // Reset the alasql database instance before each run to ensure a clean slate
        alasql('DROP DATABASE IF EXISTS testdb; CREATE DATABASE testdb; USE testdb;');
        
        // Execute the user's code
        const results = alasql(code);
        
        // Format the output
        if (results === undefined || results === null || results.length === 0) {
          resolve("Query executed successfully (no results returned).");
        } else {
          // Attempt to render as a table if it's an array of objects
          if (Array.isArray(results) && results.length > 0) {
            
            // Alasql returns an array of results for multiple statements. Find the final array result (like a SELECT)
            let finalResultSet = results;
            const arrayResults = results.filter(r => Array.isArray(r));
            
            if (arrayResults.length > 0) {
              finalResultSet = arrayResults[arrayResults.length - 1];
            }

            if (Array.isArray(finalResultSet) && finalResultSet.length > 0 && typeof finalResultSet[0] === 'object') {
              const headers = Object.keys(finalResultSet[0]);
              let outputStr = headers.join(' | ') + '\n';
              outputStr += headers.map(() => '---').join('-+-') + '\n';
              
              finalResultSet.forEach(row => {
                outputStr += headers.map(h => row[h]).join(' | ') + '\n';
              });
              
              resolve(outputStr.trim());
            } else {
              // If there's no tabular data, just indicate success
              resolve("Query executed successfully. " + JSON.stringify(finalResultSet));
            }
          } else {
            resolve(JSON.stringify(results, null, 2));
          }
        }
      } catch (error) {
        resolve(`SQL Error:\n${error.message}`);
      }
    });
  }
}
