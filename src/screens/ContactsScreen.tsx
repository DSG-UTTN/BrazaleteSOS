// 🚨 BrazaleteSOS - Pantalla de Contactos

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { StorageService } from '../services';
import type { EmergencyContact } from '../types';
import { COLORS, SPACING, FONT_SIZES, MAX_CONTACTS } from '../utils/constants';
import { validateContact } from '../utils/validators';
import { formatPhoneNumber, getInitials } from '../utils/formatters';
import uuid from 'react-native-uuid';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: 'family' as EmergencyContact['relationship'],
    notes: '',
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const loaded = await StorageService.getContacts();
    setContacts(loaded.sort((a, b) => a.priority - b.priority));
  };

  const openAddModal = () => {
    if (contacts.length >= MAX_CONTACTS) {
      Alert.alert('Límite Alcanzado', `Solo puedes tener ${MAX_CONTACTS} contactos de emergencia.`);
      return;
    }
    setEditingContact(null);
    setFormData({ name: '', phone: '', relationship: 'family', notes: '' });
    setModalVisible(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      notes: contact.notes || '',
    });
    setModalVisible(true);
  };

  const saveContact = async () => {
    const errors = validateContact({
      ...formData,
      priority: editingContact?.priority || contacts.length + 1,
    });

    if (errors.length > 0) {
      Alert.alert('Error de Validación', errors.join('\n'));
      return;
    }

    try {
      if (editingContact) {
        // Editar contacto existente
        const updated: EmergencyContact = {
          ...editingContact,
          ...formData,
        };
        await StorageService.updateContact(editingContact.id, updated);
      } else {
        // Agregar nuevo contacto
        const newContact: EmergencyContact = {
          id: uuid.v4() as string,
          ...formData,
          priority: contacts.length + 1,
        };
        await StorageService.addContact(newContact);
      }

      setModalVisible(false);
      await loadContacts();
      Alert.alert('✅ Éxito', `Contacto ${editingContact ? 'actualizado' : 'agregado'} correctamente`);
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo guardar el contacto');
    }
  };

  const deleteContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Eliminar Contacto',
      `¿Estás seguro que deseas eliminar a ${contact.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await StorageService.deleteContact(contact.id);
            await loadContacts();
            Alert.alert('✅ Eliminado', 'Contacto eliminado correctamente');
          },
        },
      ],
    );
  };

  const renderContact = ({ item }: { item: EmergencyContact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactAvatar}>
        <Text style={styles.contactAvatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{formatPhoneNumber(item.phone)}</Text>
        <Text style={styles.contactRelation}>
          {item.relationship === 'family' && '👨‍👩‍👧 Familia'}
          {item.relationship === 'friend' && '👥 Amigo'}
          {item.relationship === 'medical' && '⚕️ Médico'}
          {item.relationship === 'emergency' && '🚨 Emergencia'}
        </Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteContact(item)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {contacts.length} de {MAX_CONTACTS} contactos
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📱</Text>
            <Text style={styles.emptyTitle}>Sin Contactos</Text>
            <Text style={styles.emptySubtitle}>
              Agrega contactos de emergencia que serán notificados en caso de SOS
            </Text>
          </View>
        }
      />

      {/* Modal de agregar/editar */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Teléfono (+52XXXXXXXXXX)"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <View style={styles.relationshipContainer}>
              {(['family', 'friend', 'medical', 'emergency'] as const).map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[
                    styles.relationshipButton,
                    formData.relationship === rel && styles.relationshipButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, relationship: rel })}>
                  <Text style={styles.relationshipText}>
                    {rel === 'family' && '👨‍👩‍👧 Familia'}
                    {rel === 'friend' && '👥 Amigo'}
                    {rel === 'medical' && '⚕️ Médico'}
                    {rel === 'emergency' && '🚨 Emergencia'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notas opcionales"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveContact}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: SPACING.md,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    elevation: 2,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  contactAvatarText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FONT_SIZES.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  contactPhone: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  contactRelation: {
    fontSize: FONT_SIZES.small,
    color: COLORS.info,
    marginTop: SPACING.xs,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: SPACING.sm,
  },
  actionButtonText: {
    fontSize: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZES.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  relationshipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  relationshipButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  relationshipButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  relationshipText: {
    fontSize: FONT_SIZES.small,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtonSave: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: FONT_SIZES.medium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalButtonTextSave: {
    color: '#FFFFFF',
  },
});
