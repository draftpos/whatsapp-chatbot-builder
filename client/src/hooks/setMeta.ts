// setMeta.ts
export interface MetaOptions {
    title?: string;
    favicon?: string;
    description?: string;
    keywords?: string;
  }
  
  export function setMeta(options: MetaOptions) {
    const head = document.head;
  
    // ---- Title ----
    if (options.title) {
      document.title = options.title;
    }
  
    // ---- Favicon ----
    if (options.favicon) {
      // Remove existing favicons
      head.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
  
      // Add new favicon (cache-bust with timestamp)
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = options.favicon + `?v=${Date.now()}`;
      head.appendChild(link);
    }
  
    // ---- Description ----
    if (options.description) {
      let descTag = head.querySelector<HTMLMetaElement>("meta[name='description']");
      if (!descTag) {
        descTag = document.createElement("meta");
        descTag.name = "description";
        head.appendChild(descTag);
      }
      descTag.content = options.description;
    }
  
    // ---- Keywords ----
    if (options.keywords) {
      let keywordsTag = head.querySelector<HTMLMetaElement>("meta[name='keywords']");
      if (!keywordsTag) {
        keywordsTag = document.createElement("meta");
        keywordsTag.name = "keywords";
        head.appendChild(keywordsTag);
      }
      keywordsTag.content = options.keywords;
    }
  }
  