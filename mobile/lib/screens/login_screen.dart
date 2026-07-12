import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import 'register_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  String _oauthLoading = ''; // 'google' | 'github' | ''
  String _authError = '';

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _authError = '');
    try {
      await ref.read(authProvider.notifier).login(
            _emailController.text.trim(),
            _passwordController.text,
          );
    } catch (e) {
      if (mounted) {
        setState(() => _authError = e.toString().replaceFirst('Exception: ', ''));
      }
    }
  }

  Future<void> _handleOAuth(String provider) async {
    setState(() {
      _oauthLoading = provider;
      _authError = '';
    });
    try {
      if (provider == 'google') {
        await ref.read(authProvider.notifier).loginWithGoogle();
      } else if (provider == 'github') {
        await ref.read(authProvider.notifier).loginWithGithub();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _authError = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _oauthLoading = '');
    }
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.black54),
      prefixIcon: Icon(icon, color: Colors.black54),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Colors.black, width: 2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Colors.black, width: 2.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Colors.redAccent, width: 2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Colors.redAccent, width: 2.5),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isEmailLoading = authState.isLoading && _oauthLoading.isEmpty;

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Header ──────────────────────────────────────────────
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFE600),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.black, width: 2.5),
                        boxShadow: const [
                          BoxShadow(offset: Offset(3, 3), color: Colors.black),
                        ],
                      ),
                      child: const Icon(Icons.bolt, size: 28, color: Colors.black),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'WELCOME BACK',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Sign in to continue learning',
                      style: TextStyle(fontSize: 13, color: Colors.black54, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // ── Card ─────────────────────────────────────────────────
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.black, width: 2.5),
                  boxShadow: const [
                    BoxShadow(offset: Offset(5, 5), color: Colors.black),
                  ],
                ),
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [

                    // ── Google Button ────────────────────────────────
                    _OAuthButton(
                      label: 'Continue with Google',
                      isLoading: _oauthLoading == 'google',
                      onTap: () => _handleOAuth('google'),
                      icon: _googleIcon(),
                    ),
                    const SizedBox(height: 12),

                    // ── GitHub Button ────────────────────────────────
                    _OAuthButton(
                      label: 'Continue with GitHub',
                      isLoading: _oauthLoading == 'github',
                      onTap: () => _handleOAuth('github'),
                      icon: _githubIcon(),
                    ),
                    const SizedBox(height: 20),

                    // ── Divider ──────────────────────────────────────
                    Row(
                      children: [
                        const Expanded(child: Divider(thickness: 2, color: Colors.black)),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            'OR',
                            style: TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 11,
                              letterSpacing: 1.5,
                              color: Colors.black,
                            ),
                          ),
                        ),
                        const Expanded(child: Divider(thickness: 2, color: Colors.black)),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ── Email / Password form ────────────────────────
                    Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextFormField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            style: const TextStyle(color: Colors.black),
                            decoration: _inputDecoration('Email', Icons.email_outlined),
                            validator: (v) {
                              if (v == null || v.isEmpty) return 'Please enter your email';
                              if (!v.contains('@')) return 'Invalid email address';
                              return null;
                            },
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            style: const TextStyle(color: Colors.black),
                            decoration: _inputDecoration('Password', Icons.lock_outline).copyWith(
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  color: Colors.black54,
                                ),
                                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) return 'Please enter your password';
                              if (v.length < 6) return 'At least 6 characters';
                              return null;
                            },
                          ),

                          // ── Error banner ─────────────────────────
                          if (_authError.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFEEEE),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.redAccent, width: 2),
                              ),
                              child: Text(
                                _authError,
                                style: const TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],

                          const SizedBox(height: 20),

                          // ── Sign In Button ───────────────────────
                          ElevatedButton(
                            onPressed: isEmailLoading ? null : _handleLogin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFFE600),
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                                side: const BorderSide(color: Colors.black, width: 2),
                              ),
                              elevation: 0,
                            ),
                            child: isEmailLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation(Colors.black),
                                    ),
                                  )
                                : const Text(
                                    'SIGN IN',
                                    style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.2, fontSize: 15),
                                  ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text("Don't have an account? ", style: TextStyle(color: Colors.black54, fontSize: 12, fontWeight: FontWeight.w600)),
                        GestureDetector(
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                          child: const Text(
                            'Sign up',
                            style: TextStyle(
                              color: Colors.black,
                              fontWeight: FontWeight.w900,
                              fontSize: 12,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _googleIcon() {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }

  Widget _githubIcon() {
    return const Icon(Icons.code, size: 20, color: Colors.black);
  }
}

// ── OAuth Button ────────────────────────────────────────────────────────────
class _OAuthButton extends StatelessWidget {
  final String label;
  final bool isLoading;
  final VoidCallback onTap;
  final Widget icon;

  const _OAuthButton({
    required this.label,
    required this.isLoading,
    required this.onTap,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.black, width: 2),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isLoading)
              const SizedBox(
                height: 18,
                width: 18,
                child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.black)),
              )
            else ...[
              icon,
              const SizedBox(width: 10),
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: Colors.black,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Google Logo (4-colour G) ─────────────────────────────────────────────────
class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Blue segment
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius),
        -0.52, 1.57, true, paint);
    // Green segment
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius),
        1.05, 1.57, true, paint);
    // Yellow segment
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius),
        2.62, 1.05, true, paint);
    // Red segment
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius),
        3.67, 1.14, true, paint);
    // White inner circle (donut hole)
    paint.color = Colors.white;
    canvas.drawCircle(center, radius * 0.6, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
