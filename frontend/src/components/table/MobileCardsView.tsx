interface MobileCardsViewProps<TData> {
  data: TData[];
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  renderCard: (item: TData) => React.ReactNode;
}

export function MobileCardsView<TData>({
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
  renderCard,
}: MobileCardsViewProps<TData>) {
  if (isLoading) {
    return <div className="p-4 text-center md:hidden">טוען נתונים...</div>;
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-destructive md:hidden">
        שגיאה בשליפת הנתונים. נסה שוב.
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="p-4 text-center md:hidden">לא נמצאו רשומות.</div>;
  }

  return (
    <div className="relative grid gap-4 md:hidden p-2 overflow-x-hidden">
      {isFetching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/50">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {data.map((item) => renderCard(item))}
    </div>
  );
}
