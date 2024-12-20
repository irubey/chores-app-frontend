export function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number
): { top: number; left: number } {
  const { offsetLeft: elementLeft, offsetTop: elementTop } = element;
  const div = document.createElement("div");
  const styles = getComputedStyle(element);

  div.style.position = "absolute";
  div.style.top = "0";
  div.style.left = "0";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.font = styles.font;
  div.style.padding = styles.padding;
  div.style.width = styles.width;

  div.textContent = element.value.substring(0, position);

  const span = document.createElement("span");
  span.textContent = element.value.substring(position) || ".";
  div.appendChild(span);

  document.body.appendChild(div);
  const coordinates = span.getBoundingClientRect();
  document.body.removeChild(div);

  return {
    top: coordinates.top + elementTop,
    left: coordinates.left + elementLeft,
  };
}
