export function formatReviewDuration(seconds:number,minutes:number):string {
  if (seconds < 60) return `${seconds} sec`;
  return `${minutes} min`;
}
