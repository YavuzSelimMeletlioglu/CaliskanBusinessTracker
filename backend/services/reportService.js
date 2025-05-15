import axios from "axios";
import QuickChart from "quickchart-js";

export async function fetchGraphData(endpoint, company_id, type) {
  const url = `http://localhost:3000${endpoint}?company_id=${company_id}&type=${type}`;
  const { data } = await axios.get(url);
  return data;
}

export async function generateChartImage({ labels, values, title }) {
  const chart = new QuickChart();
  chart.setConfig({
    type: "bar",
    data: {
      labels,
      datasets: [{ label: title, data: values }],
    },
  });
  chart.setWidth(500).setHeight(300);
  return await chart.toBinary();
}
