import { saveAs } from 'file-saver';


export const jsonGenerator = {
    downloadJSON: (data: any, filename: string) => {
        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            saveAs(blob, `${filename}.json`);
        } catch (error) {
            console.error("Error generating JSON:", error);
        }
    }
};
