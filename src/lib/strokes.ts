const CDN = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/';

export function hanziUrl(char: string): { local: string; remote: string } {
  const point = char.codePointAt(0);
  const hex = point ? point.toString(16) : '';
  return {
    local: `${import.meta.env.BASE_URL}hanzi/${hex}.json`,
    remote: `${CDN}${encodeURIComponent(char)}.json`,
  };
}

export function loadCharData(
  char: string,
  onLoad: (data: unknown) => void,
  onError: (err?: unknown) => void,
): void {
  const { local, remote } = hanziUrl(char);
  fetch(local)
    .then((res) => {
      if (!res.ok) throw new Error('missing');
      return res.json();
    })
    .then(onLoad)
    .catch(() => {
      fetch(remote)
        .then((res) => {
          if (!res.ok) throw new Error('stroke data unavailable');
          return res.json();
        })
        .then(onLoad)
        .catch(onError);
    });
}
