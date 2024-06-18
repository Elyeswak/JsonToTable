import React, { useState } from 'react';

interface JsonField {
  name: string;
  type: string | number | boolean | 'array' | object | undefined | unknown | Function | null | undefined;
  isArray?: boolean;
  children?: JsonField[];
}

const JsonUpload: React.FC = () => {
  const [jsonData, setJsonData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (content) {
          try {
            const parsedData = JSON.parse(content as string);

            if (validateJson(parsedData)) {
              setJsonData(parsedData);
              setError(null);
            } else {
              setError('Invalid JSON: No array field named "data" found');
              setJsonData(null);
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
            setError('Error parsing JSON');
            setJsonData(null);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReupload = () => {
    setJsonData(null);
    setError(null);
  };

  const validateJson = (data: any): boolean => {
    const allFields = getAllFields(data);
    console.log(allFields);
    const hasDataArray = allFields.some(field => field.name.endsWith('data') && field.isArray === true);

    return hasDataArray;
  };

  const getAllFields = (data: any, parentPath = ''): JsonField[] => {
    const fields: JsonField[] = [];

    const processFields = (obj: any, path: string) => {
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          const fieldPath = path ? `${path}.${key}` : key;
          const fieldValue = obj[key];
          const fieldType = typeof fieldValue;

          const field: JsonField = {
            name: fieldPath,
            type: fieldType === 'object' ? (Array.isArray(fieldValue) ? 'array' : 'object') : fieldType,
            isArray: Array.isArray(fieldValue),
          };

          fields.push(field);

          if (fieldType === 'object' && !Array.isArray(fieldValue)) {
            processFields(fieldValue, fieldPath);
          }

          if (Array.isArray(fieldValue)) {
            fieldValue.forEach((item, index) => {
              processFields(item, `${fieldPath}[${index}]`);
            });
          }
        }
      }
    };

    processFields(data, parentPath);
    return fields;
  };

  const findDataArray = (obj: any): any[] => {
    const result: any[] = [];

    const searchForArray = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (key === 'data' && Array.isArray(obj[key])) {
            result.push(obj[key]);
          } else if (typeof obj[key] === 'object') {
            searchForArray(obj[key]);
          }
        }
      }
    };

    searchForArray(obj);
    return result.length > 0 ? result[0] : [];
  };

  const extractHeaders = (arr: any[]): string[] => {
    const headers = new Set<string>();

    const processObject = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (key !== 'id') {
            headers.add(key);
          }
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            processObject(obj[key]);
          }
        }
      }
    };

    arr.forEach(item => processObject(item));
    return Array.from(headers);
  };

  const formatData = (value: any): string => {
    if (value === undefined || value === null || value === '') {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-700 p-6">
      <div className="w-full max-w-4xl">
        {jsonData ? (
          <div className="flex justify-end">
            <button
              onClick={handleReupload}
              className="mb-4 p-2 bg-green-500 text-white rounded hover:bg-blue-800 transition duration-300"
            >
              Reupload JSON
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <label className="mb-4 p-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300 cursor-pointer">
              Choose a JSON File to Upload
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
        {error && <div className="text-red-500">{error}</div>}
        {jsonData && (
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h1 className="text-2xl font-bold mb-4 text-white">Dynamic JSON Table</h1>
                <div className="overflow-x-auto">
                  <div className="text-white mb-4" dangerouslySetInnerHTML={{ __html: jsonData.message.analysis }} />
                  <JsonTable data={jsonData} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const JsonTable: React.FC<{ data: any }> = ({ data }) => {
  const dataArray = findDataArray(data.message || data);
  const headers = extractHeaders(dataArray);

  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return <div className="text-white">No valid data array found in the JSON.</div>;
  }

  return (
    <table className="min-w-full divide-y divide-gray-300">
      <thead>
        <tr className="bg-gray-400">
          {headers.map(header => (
            <th key={header} className="px-4 py-2 border border-gray-200 text-left text-sm font-semibold text-gray-900">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {dataArray.map((item: any, index: number) => (
          <tr key={index}>
            {headers.map(header => (
              <td key={header} className="px-4 py-2 border border-gray-200">
                {Array.isArray(item[header]) ? (
                  <NestedTable data={item[header]} />
                ) : (
                  formatData(item[header])
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const NestedTable: React.FC<{ data: any[] }> = ({ data }) => {
  const headers = extractHeaders(data);

  return (
    <table className="min-w-full divide-y divide-gray-300">
      <thead>
        <tr className="bg-gray-300">
          {headers.map(header => (
            <th key={header} className="px-2 py-1 border border-gray-200 text-left text-xs font-semibold text-gray-900">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-gray-100">
        {data.map((item: any, index: number) => (
          <tr key={index}>
            {headers.map(header => (
              <td key={header} className="px-2 py-1 border border-gray-200">
                {Array.isArray(item[header]) ? (
                  <NestedTable data={item[header]} />
                ) : (
                  formatData(item[header])
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const findDataArray = (obj: any): any[] => {
  const result: any[] = [];

  const searchForArray = (obj: any) => {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (key === 'data' && Array.isArray(obj[key])) {
          result.push(obj[key]);
        } else if (typeof obj[key] === 'object') {
          searchForArray(obj[key]);
        }
      }
    }
  };

  searchForArray(obj);
  return result.length > 0 ? result[0] : [];
};

const extractHeaders = (arr: any[]): string[] => {
  const headers = new Set<string>();

  const processObject = (obj: any) => {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (key !== 'id') {
          headers.add(key);
        }
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          processObject(obj[key]);
        }
      }
    }
  };

  arr.forEach(item => processObject(item));
  return Array.from(headers);
};

const formatData = (value: any): string => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

export default JsonUpload;
