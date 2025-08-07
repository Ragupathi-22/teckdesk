import {
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../../core/services/data.service';
import { ToastService } from '../../../../shared/service/toast.service';
import { LoadingService } from '../../../../shared/service/loading.service'; // optional
import { TicketCategory } from '../../../../core/models/company.models';
import { AssetModel } from '../../../../core/models/asset.model';
import { environment } from '../../../../../environment';

@Component({
  selector: 'app-raise-ticket-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './raise-ticket-form.html',
})
export class RaiseTicketForm implements OnInit {
  private data = inject(DataService);
  private toastr = inject(ToastService);

  @Output() submit = new EventEmitter<{
    title: string;
    description: string;
    category: string;
    assetTag: string;
    images: string[];
  }>();

  @Output() close = new EventEmitter<void>();

  categories = signal<TicketCategory[]>([]);
  assets = signal<AssetModel[]>([]);
  imageUrls = signal<string[]>([]);
  uploading = signal<boolean>(false);

  form = signal({
    title: '',
    description: '',
    category: '',
    assetTag: '',
  });

  async ngOnInit() {
    try {
      this.categories.set(this.data.getTicketCategory());
      const uid = this.data.getFirebaseUser()?.uid;
      if (!uid) return;

      const employee = await this.data.getEmployeeById(uid);
      if (employee?.id) {
        const empAssets = await this.data.getAssetsByEmployee(employee.id);
        this.assets.set(empAssets);
      }
    } catch (err) {
      this.toastr.error('Failed to load form data');
    }
  }

async handleImageUpload(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files || !files.length) return;

  const currentImages = this.imageUrls();
  const totalImages = currentImages.length + files.length;

  if (totalImages > 5) {
    this.toastr.error('You can upload a maximum of 5 images.');
    return;
  }

  this.uploading.set(true);

  for (let i = 0; i < files.length; i++) {
    const formData = new FormData();
    formData.append('image', files[i]);

    try {
      const response = await fetch(environment.API_URL + "/upload_ticket_images.php", {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.path) {
        this.imageUrls.set([...this.imageUrls(), result.path]);
      } else {
        this.toastr.error(result.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      this.toastr.error('Network error during image upload');
    }
  }

  this.uploading.set(false);
}

  async deleteImage(url: string) {
    const filename = url.split('/').pop();
    try {
      const response = await fetch(environment.API_URL+'/delete_tic_img.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      const result = await response.json();
      if (result.success) {
        const filtered = this.imageUrls().filter((img) => img !== url);
        this.imageUrls.set(filtered);
        this.toastr.success('Image deleted');
      } else {
        this.toastr.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      this.toastr.error('Error deleting image');
    }
  }

  handleSubmit() {
    const { title, description, category, assetTag } = this.form();
    if (!title || !description || !category || !assetTag) {
      this.toastr.error('Please fill out all required fields *');
      return;
    }

    this.submit.emit({
      ...this.form(),
      images: this.imageUrls(),
    });
  }

async handleClose() {
  const urls = this.imageUrls();
  if (urls.length) {
    for (const url of urls) {
      await this.deleteImage(url); // Delete each image from server
    }
  }

  this.imageUrls.set([]); // Clear from UI
  this.close.emit();      // Close form
}


  updateCategory(value: string) {
    this.form.update((f) => ({ ...f, category: value }));
  }
  updateTitle(value: string) {
    this.form.update((f) => ({ ...f, title: value }));
  }
  updateDescription(value: string) {
    this.form.update((f) => ({ ...f, description: value }));
  }
  updateAssetTag(value: string) {
    this.form.update((f) => ({ ...f, assetTag: value }));
  }
}
