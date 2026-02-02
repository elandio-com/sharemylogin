import { useEffect } from 'react';

export function useDocumentTitle(title: string, description: string) {
    useEffect(() => {
        document.title = `${title} | ShareMyLogin Reference`;
    }, [title]);
}
