const width =1500;
const height=900;
  

function make_tree(data) {
  [nodes, edges] = data;

  // 1. Helper to look up country and date for each node ID.
  nodes_lookup = {}
  for (let i = 0; i < nodes.length; i++) {
    nodes_lookup[i + 1] = nodes[i]
  }
  //

  edges.push({ to: 1, from: null });  
    
  // 2. Count occurrences of each country
  const countryCounts = {};
  nodes.forEach(node => {
    //const country = node.country || "Unknown";  
    let country = node.country || "Unknown";  
    
    // Treat "NA" as "Unknown"
    if (country === "NA") {
      country = "Unknown";
    }
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });  
    
  //// 6. Replace "NA" with "Unknown" in the country counts
  //countryCounts["Unknown"] = (countryCounts["Unknown"] || 0) + (countryCounts["NA"] || 0);
  //delete countryCounts["NA"];  
  
  // Classify countries into common, "Other", and "Unknown"
  const commonCountries = Object.keys(countryCounts).filter(country => countryCounts[country] >= 5&& country !== "Unknown");
  const otherCountries = Object.keys(countryCounts).filter(country => countryCounts[country] < 5);
  //  
    
  stratifier = d3.stratify()
    .id(d => d.to)
    .parentId(d => d.from);

  let root = stratifier(edges);
  
  
  // apply d3.tree()-based function to root
  const treeLayout = d3.tree().size([width, height]);
  tree = treeLayout(root);
  
    
  // 3. Color mapping function  
  // Color mapping function
  const colorScale = d3.scaleOrdinal()
    .domain(commonCountries)
    //.range(d3.schemeCategory10);
    .range(d3.schemeSet3);    

  
  const getColor = (country) => {  
    if (country === "NA" || country === "Unknown") {
      return "#999999"; // Grey for "Unknown" and "NA"  
    }
    if (commonCountries.includes(country)) {
      //return d3.schemeCategory10[commonCountries.indexOf(country)];
      return colorScale(country);
    } else if (otherCountries.includes(country)) {
      //return "#CCCCCC"; // Grey for "Other"
      return "black"; // Black for "Other"
    } else {
      return "#999999"; // Grey for "Unknown"
    }
  };  
  
  // Add the visualization code here
  // ...
    // 静态树形可视化
  const svg = d3.select("#tree").append("svg")
    .attr("height", height)
    .attr("width", width);

  // 遍历节点，绘制节点和连接线
  tree.each(node => {
    // 绘制连接线
    if (node.parent) {
      svg.append("line")
        .attr("x1", node.x)
        .attr("y1", node.y)
        .attr("x2", node.parent.x)
        .attr("y2", node.parent.y)
        .attr("stroke", "black")
        .attr("stroke-opacity", 0.5)  // 设置透明度
        .attr("stroke-width", 0.5);    // 设置粗细
    }    
      
    // 4. Draw nodes using color mapping function
    const country = nodes_lookup[node.id].country || "Unknown";
    const fillColor = getColor(country);  
    //  
    
    // 绘制节点
    svg.append("circle")
      .attr("cx", node.x)
      .attr("cy", node.y)
      .attr("r", 3)
      //.attr("fill", "#A0C3D9");
      .attr("fill", fillColor) 
      //part b.
      .attr("id", `node_${node.id}`); // 添加唯一的 ID

    // 添加节点标签
    svg.append("text")
      .attr("x", node.x+2)
      .attr("y", node.y)
      .attr("dy", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", "5px")
      .text(node.id)
      .attr("transform", `translate(0, ${node.depth-10})`);  // 根据节点深度进行垂直调整;
  });   
  
  // 5. Legend
  const legendData = [
    { color: "#CCCCCC", label: "Other" },
    //{ color: "#999999", label: "Unknown" },
    //...commonCountries.map((country, index) => ({ color: d3.schemeCategory10[index], label: country }))  
    ...commonCountries.map(country => ({ color: colorScale(country), label: country }))
  ];  
  
  // 7. Add "Unknown" to legend only if it's not already included
  if (!commonCountries.includes("Unknown")) {
    legendData.push({ color: "#999999", label: "Unknown" });
  }

  const legend = svg.append("g")
    //.attr("transform", `translate(${width - 150}, 20)`);  
    .attr("transform", `translate(${width - 120}, ${height - 260})`); // 调整图例位置至右下角

  const legendRectSize = 15;
  const legendSpacing = 5;

  legend.selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("width", legendRectSize)
    .attr("height", legendRectSize)
    .attr("x", 0)
    .attr("y", (d, i) => i * (legendRectSize + legendSpacing))
    .attr("fill", d => d.color)  
    .attr("id", d => `legend_${d.label}`); // Add unique ID to legend item

  legend.selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", legendRectSize + legendSpacing)
    .attr("y", (d, i) => i * (legendRectSize + legendSpacing) + legendRectSize / 2)
    .attr("dy", "0.35em")
    .text(d => d.label)
    .style("font-size", "12px")
    .attr("id", d => `legend_${d.label}`); // Add unique ID to legend item
}

  // Example: print the tree structure to console
  //console.log(root);
//}

function visualize(data) {
  make_tree(data);
  // Other visualization code can go here
}

Promise.all([
  d3.csv("covid-nodes.csv", d3.autoType),
  d3.csv("covid-edges.csv", d3.autoType)
]).then(visualize);  
  
// 8. Add a change event listener to the country selection menu
const countrySelect = document.getElementById("country_select");
countrySelect.addEventListener("change", handleCountrySelection);

// Function to handle country selection change
function handleCountrySelection() {
  // Get selected countries from the selection menu
  const selectedCountries = Array.from(countrySelect.selectedOptions, option => option.value);

  // Update node visualization based on selected countries
  tree.each(node => {
    const country = nodes_lookup[node.id].country || "Unknown";
    const isCountrySelected = selectedCountries.includes(country);

    // Update node visibility
    d3.select(`#node_${node.id}`).attr("fill", isCountrySelected ? "red" : "#999999"); // Highlight selected countries  
      
    // Update legend item color based on selection
    const legendItem = d3.select(`#legend_${country}`);
    legendItem.attr("fill", isCountrySelected ? "red" : "#999999");
  });
}
