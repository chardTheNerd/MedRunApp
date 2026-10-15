import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../core/theme/colors';
import { Consultation } from '../domain/entities/Consultation';
import { useAuth } from '../presentation/providers/AuthProvider';
import { useCatalog } from '../presentation/providers/CatalogProvider';
import { useConsultations } from '../presentation/providers/ConsultationProvider';

function first(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ConsultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ drug?: string; pharmacyId?: string; consultationId?: string }>();
  const auth = useAuth();
  const catalog = useCatalog();
  const consultations = useConsultations();

  const drug = first(params.drug);
  const pharmacyIdParam = first(params.pharmacyId);
  const [activeId, setActiveId] = useState<string | null>(first(params.consultationId) ?? null);
  const [created, setCreated] = useState<Consultation | null>(null);
  const [complaint, setComplaint] = useState(drug ? `Question about ${drug}` : '');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (auth.user) {
      consultations.loadPatientConsultations(auth.user.id);
    }
    if (pharmacyIdParam) {
      catalog.loadPharmacy(pharmacyIdParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = useMemo(
    () => created ?? consultations.consultations.find((c) => c.id === activeId) ?? null,
    [created, consultations.consultations, activeId],
  );

  useEffect(() => {
    if (active) {
      consultations.loadMessages(active.id);
      if (active.pharmacyId && active.pharmacyId !== catalog.selectedPharmacy?.id) {
        catalog.loadPharmacy(active.pharmacyId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  async function handleRequest() {
    if (!auth.user || !complaint.trim()) {
      return;
    }
    const result = await consultations.request({
      patientId: auth.user.id,
      consultantId: null,
      pharmacyId: pharmacyIdParam ?? null,
      channel: 'chat',
      chiefComplaint: complaint.trim(),
      relatedOrderId: null,
    });
    if (result) {
      setCreated(result);
      setActiveId(result.id);
    }
  }

  async function handleSend() {
    if (!auth.user || !active || !draft.trim()) {
      return;
    }
    setSending(true);
    try {
      const ok = await consultations.sendMessage(active.id, auth.user.id, draft);
      if (ok) {
        setDraft('');
      }
    } finally {
      setSending(false);
    }
  }

  function handleCall() {
    const phone = catalog.selectedPharmacy?.phoneE164;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  }

  if (!auth.user) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Sign in to chat with a pharmacist</Text>
          <Text style={styles.body}>
            Consultations are linked to your account so a licensed pharmacist can follow up.
          </Text>
          <Pressable style={styles.button} onPress={() => router.replace('/')}>
            <Text style={styles.buttonText}>Go to home to sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!active) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Ask a licensed pharmacist</Text>
          <Text style={styles.body}>
            {pharmacyIdParam && catalog.selectedPharmacy
              ? `${catalog.selectedPharmacy.name} · PCN ${catalog.selectedPharmacy.pcnLicenseNumber}`
              : 'A verified pharmacist will respond here.'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Describe your question or symptoms"
            value={complaint}
            onChangeText={setComplaint}
            multiline
          />
          <Pressable
            style={[styles.button, !complaint.trim() && styles.buttonDisabled]}
            onPress={handleRequest}
            disabled={!complaint.trim() || consultations.loading}
          >
            <Text style={styles.buttonText}>
              {consultations.loading ? 'Starting…' : 'Start consultation'}
            </Text>
          </Pressable>
          {consultations.error ? <Text style={styles.error}>{consultations.error}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Past consultations</Text>
        <FlatList
          data={consultations.consultations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.pastCard} onPress={() => setActiveId(item.id)}>
              <Text style={styles.pastComplaint} numberOfLines={2}>
                {item.chiefComplaint}
              </Text>
              <Text style={styles.pastMeta}>
                {item.status} · {item.createdAt.toLocaleDateString('en-NG')}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No past consultations yet.</Text>}
        />
      </View>
    );
  }

  const pharmacy = catalog.selectedPharmacy;
  const isMine = (senderId: string) => senderId === auth.user?.id;

  return (
    <View style={styles.container}>
      <View style={styles.threadHeader}>
        <View style={styles.threadTitles}>
          <Text style={styles.threadTitle}>{pharmacy ? pharmacy.name : 'MedRun pharmacist'}</Text>
          {pharmacy ? (
            <Text style={styles.threadMeta}>
              PCN {pharmacy.pcnLicenseNumber} · {active.status}
            </Text>
          ) : (
            <Text style={styles.threadMeta}>{active.status}</Text>
          )}
        </View>
        {pharmacy?.phoneE164 ? (
          <Pressable style={styles.callButton} onPress={handleCall}>
            <Text style={styles.callText}>Call</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={consultations.messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, isMine(item.senderId) ? styles.mine : styles.theirs]}>
            <Text style={isMine(item.senderId) ? styles.mineText : styles.theirsText}>{item.body}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Say hello — a pharmacist will join shortly.</Text>}
        contentContainerStyle={styles.thread}
      />

      {consultations.error ? <Text style={styles.error}>{consultations.error}</Text> : null}
      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Type a message"
          value={draft}
          onChangeText={setDraft}
          multiline
          editable={!sending}
        />
        <Pressable
          style={[styles.sendButton, (!draft.trim() || sending) && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={!draft.trim() || sending}
        >
          <Text style={styles.buttonText}>{sending ? '…' : 'Send'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  body: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  error: {
    marginTop: 8,
    color: colors.danger,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  pastCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  pastComplaint: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  pastMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
    marginTop: 12,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  threadTitles: {
    flex: 1,
  },
  threadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  threadMeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  callButton: {
    backgroundColor: colors.brandDark,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  callText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  thread: {
    paddingBottom: 8,
    gap: 8,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.brand,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
  },
  mineText: {
    color: colors.white,
    fontSize: 14,
  },
  theirsText: {
    color: colors.ink,
    fontSize: 14,
  },
  composer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  composerInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
});
