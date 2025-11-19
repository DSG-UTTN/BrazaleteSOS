// 🚨 BrazaleteSOS - Historial de Alertas

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StorageService } from '../services';
import type { SOSAlert } from '../types';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import { formatDateTime, formatRelativeTime } from '../utils/formatters';

export default function AlertHistoryScreen() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const history = await StorageService.getAlertsHistory();
    setAlerts(history);
  };

  const clearHistory = () => {
    Alert.alert(
      'Limpiar Historial',
      '¿Estás seguro que deseas eliminar todo el historial de alertas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAlertsHistory();
            await loadAlerts();
            Alert.alert('✅ Limpiado', 'Historial eliminado correctamente');
          },
        },
      ],
    );
  };

  const renderAlert = ({ item }: { item: SOSAlert }) => {
    const answeredCalls = item.callResults.filter(r => r.answered).length;
    const sentSMS = item.smsResults.filter(r => r.status === 'sent').length;

    return (
      <View style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertStatus}>
            {item.status === 'completed' ? '✅' : item.status === 'in-progress' ? '⏳' : '❌'}
          </Text>
          <View style={styles.alertHeaderText}>
            <Text style={styles.alertDate}>{formatDateTime(item.timestamp)}</Text>
            <Text style={styles.alertRelativeTime}>{formatRelativeTime(item.timestamp)}</Text>
          </View>
        </View>

        <View style={styles.alertStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>📱 SMS</Text>
            <Text style={styles.statValue}>
              {sentSMS}/{item.smsResults.length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>📞 Llamadas</Text>
            <Text style={styles.statValue}>
              {item.callResults.length}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>✅ Respondidas</Text>
            <Text style={[styles.statValue, answeredCalls > 0 && styles.statValueSuccess]}>
              {answeredCalls}
            </Text>
          </View>
        </View>

        <View style={styles.alertLocation}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>
            {item.location.address || `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`}
          </Text>
        </View>

        {/* Detalles de llamadas */}
        {item.callResults.map((call, index) => (
          <View key={index} style={styles.callDetail}>
            <Text style={styles.callDetailText}>
              {call.answered ? '✅' : '❌'} {call.contact.name} - {call.status} ({call.duration}s)
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{alerts.length} alertas registradas</Text>
        {alerts.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <Text style={styles.clearButtonText}>🗑️ Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📋</Text>
            <Text style={styles.emptyTitle}>Sin Historial</Text>
            <Text style={styles.emptySubtitle}>
              Las alertas de emergencia enviadas aparecerán aquí
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  headerText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
  },
  clearButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: SPACING.md,
  },
  alertCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  alertStatus: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  alertHeaderText: {
    flex: 1,
  },
  alertDate: {
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  alertRelativeTime: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  alertStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statValueSuccess: {
    color: COLORS.success,
  },
  alertLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  locationText: {
    flex: 1,
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  callDetail: {
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  },
  callDetailText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  emptyText: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
