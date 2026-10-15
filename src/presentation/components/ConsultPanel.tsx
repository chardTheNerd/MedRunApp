import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Consultation } from '../../domain/entities/Consultation';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../providers/AuthProvider';
import { useCatalog } from '../providers/CatalogProvider';
import { useConsultations } from '../providers/ConsultationProvider';
import { useTheme } from '../providers/ThemeProvider';

export type ConsultPanelParams = {
  drug?: string;
  pharmacyId?: string;
  consultationId?: string;
};

/**
 * Pharmacist consultation flow: request form, past consultations, and chat
 * thread with pharmacist name/PCN header plus tap-to-call. Rendered inside
 * the bottom sheet and (as a fallback) the /consult route.
 */
export function ConsultPanel({ drug, pharmacyId, consultationId }: ConsultPanelParams) {
  const auth = useAuth();
  const catalog = useCatalog();
  const consultations = useConsultations();
  const { palette } = useTheme();

  const [activeId, setActiveId] = useState<string | null>(consultationId ?? null);
  const [created, setCreated] = useState<Consultation | null>(null);
  const [complaint, setComplaint] = useState(drug ? `Question about ${drug}` : '');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (auth.user) {
      consultations.loadPatientConsultations(auth.user.id);
    }
    if (pharmacyId) {
      catalog.loadPharmacy(pharmacyId);
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
      pharmacyId: pharmacyId ?? null,
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
      <View>
        <Text style={[styles.title, { color: palette.ink }]}>Sign in to chat with a pharmacist</Text>
        <Text style={[styles.body, { color: palette.muted }]}>
          Consultations are linked to your account so a licensed pharmacist can follow up.
        </Text>
        <AuthForm />
      </View>
    );
  }

  if (!active) {
    return (
      <View>
        <Text style={[styles.title, { color: palette.ink }]}>Ask a licensed pharmacist</Text>
        <Text style={[styles.body, { color: palette.muted }]}>
          {pharmacyId && catalog.selectedPharmacy
            ? `${catalog.selectedPharmacy.name} · PCN ${catalog.selectedPharmacy.pcnLicenseNumber}`
            : 'A verified pharmacist will respond here.'}
        </Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: palette.border, color: palette.ink, backgroundColor: palette.card },
          ]}
          placeholder="Describe your question or symptoms"
          placeholderTextColor={palette.muted}
          value={complaint}
          onChangeText={setComplaint}
          multiline
        />
        <Pressable
          style={[styles.button, { backgroundColor: palette.brand }, !complaint.trim() && styles.buttonDisabled]}
          onPress={handleRequest}
          disabled={!complaint.trim() || consultations.loading}
        >
          <Text style={styles.buttonText}>
            {consultations.loading ? 'Starting…' : 'Start consultation'}
          </Text>
        </Pressable>
        {consultations.error ? (
          <Text style={[styles.error, { color: palette.danger }]}>{consultations.error}</Text>
        ) : null}

        <Text style={[styles.sectionTitle, { color: palette.ink }]}>Past consultations</Text>
        <FlatList
          data={consultations.consultations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.pastCard, { backgroundColor: palette.card }]}
              onPress={() => setActiveId(item.id)}
            >
              <Text style={[styles.pastComplaint, { color: palette.ink }]} numberOfLines={2}>
                {item.chiefComplaint}
              </Text>
              <Text style={[styles.pastMeta, { color: palette.muted }]}>
                {item.status} · {item.createdAt.toLocaleDateString('en-NG')}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: palette.muted }]}>No past consultations yet.</Text>
          }
        />
      </View>
    );
  }

  const pharmacy = catalog.selectedPharmacy;
  const isMine = (senderId: string) => senderId === auth.user?.id;

  return (
    <View style={styles.thread}>
      <View style={[styles.threadHeader, { backgroundColor: palette.card }]}>
        <View style={styles.threadTitles}>
          <Text style={[styles.threadTitle, { color: palette.ink }]}>
            {pharmacy ? pharmacy.name : 'MedRun pharmacist'}
          </Text>
          {pharmacy ? (
            <Text style={[styles.threadMeta, { color: palette.muted }]}>
              PCN {pharmacy.pcnLicenseNumber} · {active.status}
            </Text>
          ) : (
            <Text style={[styles.threadMeta, { color: palette.muted }]}>{active.status}</Text>
          )}
        </View>
        {pharmacy?.phoneE164 ? (
          <Pressable style={[styles.callButton, { backgroundColor: palette.brandDark }]} onPress={handleCall}>
            <Text style={styles.callText}>Call</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={consultations.messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              isMine(item.senderId)
                ? [styles.mine, { backgroundColor: palette.brand }]
                : [styles.theirs, { backgroundColor: palette.card }],
            ]}
          >
            <Text
              style={isMine(item.senderId) ? styles.mineText : [styles.theirsText, { color: palette.ink }]}
            >
              {item.body}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: palette.muted }]}>
            Say hello — a pharmacist will join shortly.
          </Text>
        }
        contentContainerStyle={styles.messages}
      />

      {consultations.error ? (
        <Text style={[styles.error, { color: palette.danger }]}>{consultations.error}</Text>
      ) : null}
      <View style={styles.composer}>
        <TextInput
          style={[styles.composerInput, { backgroundColor: palette.card, color: palette.ink }]}
          placeholder="Type a message"
          placeholderTextColor={palette.muted}
          value={draft}
          onChangeText={setDraft}
          multiline
          editable={!sending}
        />
        <Pressable
          style={[styles.sendButton, { backgroundColor: palette.brand }, (!draft.trim() || sending) && styles.buttonDisabled]}
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
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  error: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  pastCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  pastComplaint: {
    fontSize: 14,
    fontWeight: '600',
  },
  pastMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 12,
  },
  thread: {
    minHeight: 320,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  threadMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  callButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  callText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  messages: {
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
  },
  theirs: {
    alignSelf: 'flex-start',
  },
  mineText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  theirsText: {
    fontSize: 14,
  },
  composer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  composerInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
});
