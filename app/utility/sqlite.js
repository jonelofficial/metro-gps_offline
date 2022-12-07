import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabase("db.db");

db.exec(
  [
    {
      sql: 'PRAGMA auto_vacuum = 1; PRAGMA secure_delete = ON; PRAGMA page_size = 100000000; PRAGMA cache_size=1000000000000; PRAGMA locking_mode = EXCLUSIVE; PRAGMA encoding="UTF-8"; PRAGMA synchronous=NORMAL; PRAGMA temp_store=FILE;',
      args: [],
    },
  ],
  false,
  (transact, resultset) =>
    console.log("W O R K I N G  S Q L I T E: ", resultset),
  (transact, err) => console.log("S Q L I T E  E R R O R: ", err)
);

export const selectTable = async (tableName) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(`SELECT * FROM ${tableName}`, [], (_, { rows }) => {
        resolve(rows._array);
      }),
        (transact, err) => reject(err);
    });
  });
};

export const dropTable = async (query) => {
  db.transaction((tx) => {
    tx.executeSql(
      `DROP TABLE ${query}`,
      (transact, resultset) => console.log(resultset),
      (transact, err) => console.log(err)
    );
  });
};

export const deleteFromTable = async (query) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(`DELETE FROM ${query}`, [], (_, { rows }) => {
        resolve(rows._array);
      }),
        (transact, err) => reject(err);
    });
  });
};

// export const deleteFromTable = async (query) => {
//   db.transaction((tx) => {
//     tx.executeSql(
//       `DELETE FROM ${query}`,
//       (transact, resultset) => console.log(resultset),
//       (transact, err) => console.log(err)
//     );
//   });
// };

export const insertToTable = async (query, values) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        values,
        (transact, resultset) => resolve(resultset),
        (transact, err) => reject(err)
      );
    });
  });
};

export const updateToTable = async (query, values) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        query,
        values,
        (transact, resultset) => resolve(resultset),
        (transact, err) => reject(err)
      );
    });
  });
};

export const createTable = async (tableName, fields) => {
  db.transaction((tx) => {
    tx.executeSql(`CREATE TABLE IF NOT EXISTS ${tableName} (${fields})`),
      (transact, resultset) => console.log(resultset),
      (transact, err) => console.log(err);
  });
};

export const showTable = async () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        (transact, res) => resolve(res),
        (transact, err) => reject(err)
      );
    });
  });
};
