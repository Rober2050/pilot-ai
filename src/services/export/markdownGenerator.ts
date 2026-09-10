import { saveAs } from 'file-saver';

export const markdownGenerator = {
    downloadMarkdown: (content: string, filename: string) => {
        try {
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            saveAs(blob, `${filename}.md`);
        } catch (error) {
            console.error("Error generating Markdown:", error);
        }
    }
};
