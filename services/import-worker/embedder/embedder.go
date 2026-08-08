package embedder

import (
	"context"
	"time"
)

const DefaultBatchSize = 32

// Embedder 抽象：生产走 OpenAI，压测走 Mock（禁止 hash 伪向量入库）
type Embedder interface {
	EmbedBatch(ctx context.Context, texts []string) ([][]float32, error)
}

type OpenAIEmbedder struct {
	APIKey string
	Model  string
	BaseURL string
}

// EmbedBatch 占位：实现时调用 OpenAI embeddings；失败返回 error，不得降级
func (o *OpenAIEmbedder) EmbedBatch(ctx context.Context, texts []string) ([][]float32, error) {
	_ = ctx
	_ = o
	return nil, errNotImplemented("OpenAIEmbedder.EmbedBatch")
}

type MockEmbedder struct {
	Delay time.Duration
	FailRate float64
}

func (m *MockEmbedder) EmbedBatch(ctx context.Context, texts []string) ([][]float32, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-time.After(m.Delay):
	}
	out := make([][]float32, len(texts))
	for i := range texts {
		v := make([]float32, 8)
		v[0] = float32(len(texts[i]))
		out[i] = v
	}
	return out, nil
}

type notImplemented string

func (e notImplemented) Error() string { return string(e) }

func errNotImplemented(name string) error {
	return notImplemented(name + " not implemented")
}
