import type { ReactElement } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text } from 'react-native';
import { colors, sharedStyles } from '../../constants/theme';
import type { PagedListState } from '../../hooks/usePagedList';
import { ErrorState } from './ErrorState';

interface PagedListProps<T> {
  list: PagedListState<T>;
  renderItem: (item: T) => ReactElement;
  keyExtractor: (item: T) => string;
  emptyState: ReactElement;
  itemLabel: string; // "habitaciones", "reservas"...
  header?: ReactElement;
  loadingPlaceholder?: ReactElement;
}

// Presentational list: the screen owns the data (usePagedList), this only draws it
export function PagedList<T>({
  list,
  renderItem,
  keyExtractor,
  emptyState,
  itemLabel,
  header,
  loadingPlaceholder,
}: PagedListProps<T>) {
  const { items, totalElements, isFirstLoad, isRefreshing, isLoadingMore, error, loadMore, retry, reload } = list;

  function renderEmpty() {
    if (isFirstLoad) return loadingPlaceholder ?? <ActivityIndicator size="large" color={colors.primary} />;
    if (error) return <ErrorState message={error} onRetry={retry} />;
    return emptyState;
  }

  function renderFooter() {
    if (isLoadingMore) return <ActivityIndicator color={colors.primary} />;
    if (items.length === 0) return undefined;
    if (error) return <ErrorState message={error} onRetry={retry} />;
    return (
      <Text style={[sharedStyles.muted, styles.summary]}>
        Mostrando {items.length} de {totalElements} {itemLabel}
      </Text>
    );
  }

  return (
    <FlatList
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      data={items}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => renderItem(item)}
      ListHeaderComponent={header}
      ListEmptyComponent={renderEmpty()}
      ListFooterComponent={renderFooter()}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshing={isRefreshing}
      onRefresh={reload}
    />
  );
}

const styles = StyleSheet.create({
  summary: { textAlign: 'center' },
});