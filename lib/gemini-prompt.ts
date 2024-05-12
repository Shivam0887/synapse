export const Model = ` Given a set of nodes and edges, your task is to organize them into a tree data structure and generate a visual representation based on certain rules. Each node represents a service like Google Drive, Slack, Notion, or Discord. Here are the rules:

1. Determine the type of each node based on keywords.
2. Define the position of each node.
3. Provide a description for each node based on its type.

You must adhere to these rules while creating the nodes and edges array. Here's a breakdown:

### Nodes Array Format:

//Rules for defining the value of "position"
//For the first node the value for the position will be { x: 0, y: 0 }, and for any subsequent nodes, the value for the position will depend upon the number of nodes. Add 300px to the x-axis, and 200px to the y-axis to an individual node that comes after the first node.

nodes = [
  {
    id: --unique-id--,
    type: "Google Drive" or "Slack" or "Notion" or "Discord",
    position: { x: --x-coordinate--, y: --y-coordinate-- },
    data: {
       title: "Google Drive" or "Slack" or "Notion" or "Discord",
       description: "Connect with Google Drive to trigger changes in the files and folders." or "Post/trigger messages into your Slack workspace." or "Create new database item and page in Notion." or "Post/trigger messages into your Discord server.",
       completed: false,
       current: false,
       metadata: {},
       type: "Google Drive" or "Slack" or "Notion" or "Discord"
    }
  },
]

### Edges Array Format:
edges = [
  {
	id: 'e1-2',
	source: nodes[0].id,
	target: nodes[1].id
  },
 ]

Step-by-Step Solution:
1. **Example: Unsupported Types**
   - Input: [Slack->Discord, Discord->Twitter]
   - Expected Output: nodes = [
     {id: 1, type: "Slack", position: { x: 0, y: 0 }, ...rest of the fields},
     {id: 2, type: "Discord", position: { x: 300, y: 200 }, ...rest of the fields}
    ];

   edges = [{ id: 1, source: nodes[0].id, target: nodes[1].id }];
   Explanation: 'Twitter' is an unsupported type, in this case, don't create the 'Twitter' node and edge between 'Discord' and 'Twitter'

2. **Example: Order of Nodes**
   - Input: [Notion->Discord, Slack->Drive, Drive->Notion]
   - Expected Output: nodes = [
     {id: 1, type: "Slack", position: { x: 0, y: 0 }, ...rest of the fields},
     {id: 2, type: "Google Drive", position: { x: 300, y: 0 }, ...rest of the fields},
     {id: 3, type: "Notion", position: { x: 600, y: 0 }, ...rest of the fields},
     {id: 4, type: "Discord", position: { x: 0, y: 200 }, ...rest of the fields}
    ];

   edges = [{id: 1, source: nodes[0].id, target: nodes[1].id}, {id: 2, source: nodes[1].id, target: nodes[2].id}, {id: 3, source: nodes[2].id, target: nodes[3].id}];
   Explanation: IMPORTANT: Topologically sort the input. If we place the 'Notion->Discord' after the last node, the order will become [Slack->Google Drive, Google Drive->Notion, Notion->Discord], that's how we can re-arrange the order of the edges. We do that because if we carefully look at the input [Notion->Discord, Slack->Google Drive, Google Drive->Notion], without re-arranging, the output consists of 5 nodes (2 Notion, 1 Discord, 1 Slack, and 1 Google Drive) and 3 edges.

3. **Example: Multiple/Parallel Edges**
   - Input: [Slack->Discord, Discord->Notion, Discord->Notion]
   - Expected Output: nodes = [
     {id: 1, type: "Slack", position: { x: 0, y: 0 }, ...rest of the fields},
     {id: 2, type: "Discord", position: { x: 300, y: 0 }, ...rest of the fields},
     {id: 3, type: "Notion", position: { x: 0, y: 200 }, ...rest of the fields}
    ];

   edges = [{id: 1, source: nodes[0].id, target: nodes[1].id}, {id: 2, source: nodes[1].id, target: nodes[2].id}];
   Explanation: Here we have two similar 'Discord->Notion, so ignore one 'Discord->Notion'

4. **Example: Multiple Source/Parent Node**
   - Input: [Drive->Discord, Slack->Discord, Notion->Discord]
   - Expected Output: nodes = [
     {id: 1, type: "Google Drive", position: { x: 0, y: 0 }, ...rest of the fields},
     {id: 2, type: "Slack", position: { x: 300, y: 0 }, ...rest of the fields},
     {id: 3, type: "Notion", position: { x: 600, y: 0 }, ...rest of the fields},
     {id: 4, type: "Discord", position: { x: 0, y: 200 }, ...rest of the fields},
     {id: 5, type: "Discord", position: { x: 300, y: 200 }, ...rest of the fields},
     {id: 6, type: "Discord", position: { x: 600, y: 400 }, ...rest of the fields}
    ];

   edges = [{id: 1, source: nodes[0].id, target: nodes[3].id}, {id: 2, source: nodes[1].id, target: nodes[4].id}, {id: 3, source: nodes[2].id, target: nodes[5].id}];
   Explanation: We have 3 edges and 4 nodes, here 'Discord' has 3 source/parent nodes, in this case, create three different edges(depending upon the number of parent nodes).

5. **Example: Loop Detection**

   - Input: [Discord->Slack, Slack->Discord] //We have 2 edges and 2 nodes
   - Expected Output: nodes = [
     {id: 1, type: "Discord", position: { x: 0, y: 0 }, ...rest of the fields},
     {id: 2, type: "Slack", position: { x: 300, y: 200 }, ...rest of the fields},
     {id: 3, type: "Discord", position: { x: 600, y: 400 }, ...rest of the fields}
    ];

   edges = [{ id: 1, source: nodes[0].id, target: nodes[1].id }, { id: 2, source: nodes[1].id, target: nodes[2].id }];
   Explanation: We have 2 edges and 3 nodes. In this case, create one more edge to avoid creating loop.


---------------------------
If more than one "Google Node" is present in the whole prompt, then only consider the 'first' occurrence and ignore the subsequent 'Google Drive' nodes and there corresponding edges.
Repeat the above steps 1-5 multiple times (Multiple Source/Parent Node, Loop Detection, Unsupported Types, Order of nodes, and Multiple/Parallel Edges) until a condition lies in any of the 5 cases (Multiple Source/Parent Node, Loop Detection, Unsupported Types, Order of nodes, and Multiple/Parallel Edges). If no match found then proceed further.
---------------------------

Always ensure the final output only contains two things, 1 nodes array and 1 edges array. No additional code snippet or explanation is necessary.
Example output response: 
"{nodes: [
  {
    "id": 1,
    "type": "Slack",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "title": "Slack",
      "description": "Post/trigger messages into your Slack workspace.",     
      "completed": false,
      "current": false,
      "metadata": {},
      "type": "Slack"
    }
  },
  {
    "id": 2,
    "type": "Notion",
    "position": {
      "x": 300,
      "y": 0
    },
    "data": {
      "title": "Notion",
      "description": "Create new database item and page in Notion.",
      "completed": false,
      "current": false,
      "metadata": {},
      "type": "Notion"
    }
  }
]",
edges: [
  {
    "id": "e1-2",
    "source": "nodes[0].id",
    "target": "nodes[1].id"
  }
]}"
`;
