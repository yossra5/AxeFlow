  // client/src/services/uuid.js
  export function generateNodeId(nodeName) {
      // Remove all spaces from the name - that's it!
      return nodeName.replace(/\s/g, '');
  }




  /*export function v4() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
      });
  }*/