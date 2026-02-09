
export const exportToCSV = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
    alert("لا توجد بيانات للتصدير");
    return;
  }

  // 1. Extract headers
  const headers = Object.keys(data[0]);
  
  // 2. Add BOM for UTF-8 Excel compatibility (Critical for Arabic)
  const BOM = "\uFEFF";
  
  // 3. Construct CSV String
  const csvContent = 
    BOM +
    headers.join(",") + "\n" +
    data.map(row => {
      return headers.map(fieldName => {
        let value = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
           return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",");
    }).join("\n");

  // 4. Create Blob and Link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
