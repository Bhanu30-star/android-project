<?php
ob_start();
// $con->close();
class Collection_cancel 
{
	function fsecollection($session_dist_ver,$id1)
	{
		ob_start();
		include("../../connect.php");
		
		$scro = date("h:i:s");
		$da  = date("Y-m-d");
		$scri =$da." ".$scro;
		
		$check_author = mysqli_query($con,"select dsr_requirement from tbl_distributor where distributor_id='$session_dist_ver'");
		while($row_data = mysqli_fetch_array($check_author))
		{
			$dist_dsr_require=$row_data['dsr_requirement'];
		}
		
		$res = mysqli_query($con,"select * from tbl_party_transaction where transaction_id='$id1'");
		while($fetch_res=mysqli_fetch_assoc($res))
		{
			extract($fetch_res);
			$edit_id1=$id1.'-'.uniqid();
			$tuser_id=$fetch_res['transaction_from'];
			$txn_date=$fetch_res['transaction_date'];
			$invoice_add_date=$fetch_res['invoice_add_date'];
			if($invoice_add_date=='0000-00-00')
				$invoice_add_date=$txn_date;
			$dep_bank_id=$fetch_res['bank_id'];
			$txn3=$fetch_res['transaction_to'];
			$txn5=$fetch_res['payment_mode'];
			$txn12=$fetch_res['cash_amount'];
			$txn13=$fetch_res['cheque_amount'];
			$txn22=$fetch_res['serial_no_bill'];
			$txn48=$fetch_res['source'];
			$txn18=$fetch_res['final_amt'];
			
			$audit_party_txn=mysqli_query($con,"INSERT INTO `tbl_bill_edit_audit`(`transaction_id`, `transaction_bill_number`, `txn_type`, `transaction_date`,`transaction_time`, `transaction_from`, `transaction_to`,`party_gstin`,`total_amount`,`discount_on_total`,`disc_amt`,`tds_amt`,`round_off_amt`,`final_amt`,`labour_charges`, `freight_charges`,`other_expenses`,`operator_detail`,`tcs_percentage`,`is_tcs`,`tcs_amount`,`final_amt_w_tcs`,`bill_cgst`,`bill_sgst`, `bill_igst`, `converted_transaction_id`, `payment_type`, `online_amt`,`cess_amount`,`payment_mode`,`payment_status`, `credit_days`, `bank_id`, `bank_name`, `cheque_no`, `cheque_date`, `supply_place`, `reverse_charge`, `cash_amount`, `cheque_amount`, `remark`, `cash_receipt_date`, `bill_type`, `barcode_bill`, `serial_no_bill`, `consignee_name`,`transport_company`,`g_r_no`,`transport_date`, `transport_address`, `message_txn_id`,`courier_facility`, `courier_no`, `reference_no`, `courier_date`, `courier_company`, `bill_date`, `reason`,`generated_by`,`insert_datetime`, `action_by`, `transaction_bill_type`, `txn_service_type`, `source`, `gst_configure`, `autofill_bill`,`gst_invoice_generation`, `txn_id`,`invoice_add_date`,`shipping_address`,`edit_source`) VALUES ('$edit_id1','".$fetch_res['transaction_bill_number']."','".$fetch_res['txn_type']."','".$fetch_res['transaction_date']."', '".$fetch_res['transaction_time']."','".$fetch_res['transaction_from']."','".$fetch_res['transaction_to']."','".$fetch_res['party_gstin']."','".$fetch_res['total_amount']."','".$fetch_res['discount_on_total']."','".$fetch_res['disc_amt']."','".$fetch_res['tds_amt']."','".$fetch_res['round_off_amt']."','".$fetch_res['final_amt']."','".$fetch_res['labour_charges']."','".$fetch_res['freight_charges']."','".$fetch_res['other_expenses']."','".$fetch_res['operator_detail']."','".$fetch_res['tcs_percentage']."','".$fetch_res['is_tcs']."','".$fetch_res['tcs_amount']."','".$fetch_res['final_amt_w_tcs']."','".$fetch_res['bill_cgst']."','".$fetch_res['bill_sgst']."','".$fetch_res['bill_igst']."','".$fetch_res['converted_transaction_id']."','".$fetch_res['payment_type']."','".$fetch_res['online_amt']."','".$fetch_res['cess_amount']."','".$fetch_res['payment_mode']."','".$fetch_res['payment_status']."','".$fetch_res['credit_days']."','".$fetch_res['bank_id']."','".$fetch_res['bank_name']."','".$fetch_res['cheque_no']."','".$fetch_res['cheque_date']."','".$fetch_res['supply_place']."','".$fetch_res['reverse_charge']."','".$fetch_res['cash_amount']."','".$fetch_res['cheque_amount']."','".$fetch_res['remark']."','".$fetch_res['cash_receipt_date']."','".$fetch_res['bill_type']."','".$fetch_res['barcode_bill']."','".$fetch_res['serial_no_bill']."','".$fetch_res['consignee_name']."','".$fetch_res['transport_company']."','".$fetch_res['g_r_no']."','".$fetch_res['transport_date']."','".$fetch_res['transport_address']."','".$fetch_res['message_txn_id']."','".$fetch_res['courier_facility']."','".$fetch_res['courier_no']."','".$fetch_res['reference_no']."','".$fetch_res['courier_date']."','".$fetch_res['courier_company']."','".$fetch_res['bill_date']."','".$fetch_res['reason']."','".$fetch_res['generated_by']."','$scri','$session_dist_ver','".$fetch_res['transaction_bill_type']."','".$fetch_res['txn_service_type']."','".$fetch_res['source']."','".$fetch_res['gst_configure']."','".$fetch_res['autofill_bill']."','".$fetch_res['gst_invoice_generation']."','".$fetch_res['txn_id']."','".$fetch_res['invoice_add_date']."','".$fetch_res['shipping_address']."','Yes')");
			$ac_cash_amt=$cash_amt-$fetch_res['cash_amount'];
			if($fetch_res['source']=='')
			{
				$res_dsr = mysqli_query($con,"select * from tbl_dsr where user_id='$tuser_id' and date='$txn_date' and dsr_status != 'Reject'");
				if(mysqli_num_rows($res_dsr)>0 || $ac_cash_amt>0)
				{
					$fetch_dsr_detail=mysqli_fetch_assoc($res_dsr);
					if($fetch_dsr_detail['dsr_status']=='Accept') {
						$dsr_adjustment=mysqli_query($con,"INSERT INTO `tbl_dsr_bill_edit_adjustment`(`transaction_id`, `amount`, `bill_date`, `fse_id`) VALUES ('$billtxn_id','$ac_cash_amt','$txn_date','$tuser_id')");
					}
					else{
						$dsr_adjustment=mysqli_query($con,"update tbl_dsr set dsr_status='Reject',accept_reject_datetime='$scri' where user_id='$tuser_id' and date='$txn_date' and dsr_status='Pending'");
					}
				}
			}

		}
		$update_result = mysqli_query($con,"select * from tbl_party_transaction_detail where transaction_id='$id1'");
		while($fetch_detail=mysqli_fetch_assoc($update_result))
		{
			$ft10=$fetch_detail['IMEI_NO'];
			$feth_pro=$fetch_detail['product_id'];
			$temp_11=$fetch_detail['quantity'];
			$ft20=$fetch_detail['free_qty'];
			$stock_insert1=mysqli_query($con,"INSERT INTO `tbl_bill_edit_detail_audit`( `transaction_id`,`product_id`,`product_name`,`product_price`, `bag_type`,`bag_qty`, `quantity`,`free_qty`,`actual_quantity`,`product_disc`,`CGST_amount`,`SGST_amount`, `IGST_amount`,`cess_pc_amt`, `cess_percentage`, `cess_final_amt`, `gst_perc`, `product_total_amt`, `taxable_amount`, `batch_no`, `expiry_date`, `adjust_stock`, `packing`,`MRP`, `consume_detail`,`barcode`, `dis_type`,`free_flag`,`free_product_id` ) VALUES ('$edit_id1','".$fetch_detail['product_id']."','".$fetch_detail['product_name']."','".$fetch_detail['product_price']."','".$fetch_detail['bag_type']."','".$fetch_detail['bag_qty']."','".$fetch_detail['quantity']."','".$fetch_detail['free_qty']."','".$fetch_detail['actual_quantity']."','".$fetch_detail['product_disc']."','".$fetch_detail['CGST_amount']."','".$fetch_detail['SGST_amount']."','".$fetch_detail['IGST_amount']."','".$fetch_detail['cess_pc_amt']."','".$fetch_detail['cess_percentage']."','".$fetch_detail['cess_final_amt']."','".$fetch_detail['gst_perc']."','".$fetch_detail['product_total_amt']."','".$fetch_detail['taxable_amount']."','".$fetch_detail['batch_no']."','".$fetch_detail['expiry_date']."','".$fetch_detail['adjust_stock']."','".$fetch_detail['packing']."','".$fetch_detail['MRP']."','".$fetch_detail['consume_detail']."','".$fetch_detail['barcode']."','".$fetch_detail['dis_type']."','".$fetch_detail['free_flag']."','".$fetch_detail['free_product_id']."')");
		
			if($txn22=="Yes")
			{
				$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='0000-00-00',saleout_time='00:00:00' where IMEI ='$ft10' and product_id='$feth_pro' and user_id='$tuser_id'");	
			}
			$txn_date=$invoice_add_date;
			
			$uq_check=mysqli_query($con,"select * from tbl_product where product_id='$feth_pro' and maintain_inventory='Yes'");
			if(mysqli_num_rows($uq_check)>0)
			{
				$uq21=mysqli_query($con,"update tbl_user_stock set quantity=round(quantity+'$temp_11'+'$ft20',2) where product_id='$feth_pro' and user_id='$tuser_id' and date ='$txn_date'");
				$uq_21=mysqli_query($con,"update tbl_user_stock set quantity=round(quantity+'$temp_11'+'$ft20',2), opening_stock = round(opening_stock+'$temp_11'+'$ft20',2) where product_id='$feth_pro' and user_id='$tuser_id' and date>'$txn_date'"); 
			}
		}
		
		if($stock_insert1)
		{
		
			$resd2 = mysqli_query($con,"DELETE FROM tbl_party_transaction_detail where transaction_id='$id1'");
			$uq_return=mysqli_query($con,"UPDATE tbl_retailer_returnable_master SET status='Deleted' where txn_id='$id1'");
			
			
			if($txn5=='Credit')
			{
				include_once "sale-purchase-balance-effect-class.php";
				$CashCollection=new Collectionbalance();
				$collections=$CashCollection->saleminuscollection($session_dist_ver,$txn18,$txn_date,$txn3);
			}
			
			if($txn48=='' && $dist_dsr_require=='Yes' && $txn5!="Credit")
			{
				include_once "cash_bank_effect_class.php";
				if(($txn5=='Cash' || $txn5=='Both') && $txn12>0)
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->purchasecashcollection($session_dist_ver,$txn12,$txn_date);
				}
				else if($txn13>0 && ($txn5=='Online' || $txn5=='Wallet') && $dep_bank_id>0)
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->purchasebankcollection($session_dist_ver,$dep_bank_id,$txn13,$txn_date);
				}
				
			}
		}
		if($resd2)
		{
			return 1;
		}
	
	}
	function admincollection($session_dist_ver,$id1)
	{
		ob_start();
		include("../../connect.php");
		
		$scro = date("h:i:s");
		$da  = date("Y-m-d");
		$scri =$da." ".$scro;
		
		$check_author = mysqli_query($con,"select dsr_requirement from tbl_distributor where distributor_id='$session_dist_ver'");
		while($row_data = mysqli_fetch_array($check_author))
		{
			$dist_dsr_require=$row_data['dsr_requirement'];
		}
		
		$res = mysqli_query($con,"select * from tbl_party_transaction where transaction_id='$id1'");
		while($fetch_res=mysqli_fetch_assoc($res))
		{
			extract($fetch_res);
			$edit_id1=$id1.'-'.uniqid();
			$tuser_id=$fetch_res['transaction_from'];
			$txn_date=$fetch_res['transaction_date'];
			$invoice_add_date=$fetch_res['invoice_add_date'];
			if($invoice_add_date=='0000-00-00')
				$invoice_add_date=$txn_date;
			$dep_bank_id=$fetch_res['bank_id'];
			$txn3=$fetch_res['transaction_to'];
			$txn5=$fetch_res['payment_mode'];
			$txn12=$fetch_res['cash_amount'];
			$txn13=$fetch_res['cheque_amount'];
			$txn22=$fetch_res['serial_no_bill'];
			$txn48=$fetch_res['source'];
			$txn18=$fetch_res['final_amt'];
			$txn46=$fetch_res['txn_service_type'];
			
			$audit_party_txn=mysqli_query($con,"INSERT INTO `tbl_bill_edit_audit`(`transaction_id`, `transaction_bill_number`, `txn_type`, `transaction_date`,`transaction_time`, `transaction_from`, `transaction_to`,`party_gstin`,`total_amount`,`discount_on_total`,`disc_amt`,`tds_amt`,`round_off_amt`,`final_amt`,`labour_charges`, `freight_charges`,`other_expenses`,`operator_detail`,`tcs_percentage`,`is_tcs`,`tcs_amount`,`final_amt_w_tcs`,`bill_cgst`,`bill_sgst`, `bill_igst`, `converted_transaction_id`, `payment_type`, `online_amt`,`cess_amount`,`payment_mode`,`payment_status`, `credit_days`, `bank_id`, `bank_name`, `cheque_no`, `cheque_date`, `supply_place`, `reverse_charge`, `cash_amount`, `cheque_amount`, `remark`, `cash_receipt_date`, `bill_type`, `barcode_bill`, `serial_no_bill`, `consignee_name`,`transport_company`,`g_r_no`,`transport_date`, `transport_address`, `message_txn_id`,`courier_facility`, `courier_no`, `reference_no`, `courier_date`, `courier_company`, `bill_date`, `reason`,`generated_by`,`insert_datetime`, `action_by`, `transaction_bill_type`, `txn_service_type`, `source`, `gst_configure`, `autofill_bill`,`gst_invoice_generation`, `txn_id`,`invoice_add_date`,`shipping_address`) VALUES ('$edit_id1','".$fetch_res['transaction_bill_number']."','".$fetch_res['txn_type']."','".$fetch_res['transaction_date']."', '".$fetch_res['transaction_time']."','".$fetch_res['transaction_from']."','".$fetch_res['transaction_to']."','".$fetch_res['party_gstin']."','".$fetch_res['total_amount']."','".$fetch_res['discount_on_total']."','".$fetch_res['disc_amt']."','".$fetch_res['tds_amt']."','".$fetch_res['round_off_amt']."','".$fetch_res['final_amt']."','".$fetch_res['labour_charges']."','".$fetch_res['freight_charges']."','".$fetch_res['other_expenses']."','".$fetch_res['operator_detail']."','".$fetch_res['tcs_percentage']."','".$fetch_res['is_tcs']."','".$fetch_res['tcs_amount']."','".$fetch_res['final_amt_w_tcs']."','".$fetch_res['bill_cgst']."','".$fetch_res['bill_sgst']."','".$fetch_res['bill_igst']."','".$fetch_res['converted_transaction_id']."','".$fetch_res['payment_type']."','".$fetch_res['online_amt']."','".$fetch_res['cess_amount']."','".$fetch_res['payment_mode']."','".$fetch_res['payment_status']."','".$fetch_res['credit_days']."','".$fetch_res['bank_id']."','".$fetch_res['bank_name']."','".$fetch_res['cheque_no']."','".$fetch_res['cheque_date']."','".$fetch_res['supply_place']."','".$fetch_res['reverse_charge']."','".$fetch_res['cash_amount']."','".$fetch_res['cheque_amount']."','".$fetch_res['remark']."','".$fetch_res['cash_receipt_date']."','".$fetch_res['bill_type']."','".$fetch_res['barcode_bill']."','".$fetch_res['serial_no_bill']."','".$fetch_res['consignee_name']."','".$fetch_res['transport_company']."','".$fetch_res['g_r_no']."','".$fetch_res['transport_date']."','".$fetch_res['transport_address']."','".$fetch_res['message_txn_id']."','".$fetch_res['courier_facility']."','".$fetch_res['courier_no']."','".$fetch_res['reference_no']."','".$fetch_res['courier_date']."','".$fetch_res['courier_company']."','".$fetch_res['bill_date']."','".$fetch_res['reason']."','".$fetch_res['generated_by']."','$scri','$session_dist_ver','".$fetch_res['transaction_bill_type']."','".$fetch_res['txn_service_type']."','".$fetch_res['source']."','".$fetch_res['gst_configure']."','".$fetch_res['autofill_bill']."','".$fetch_res['gst_invoice_generation']."','".$fetch_res['txn_id']."','".$fetch_res['invoice_add_date']."','".$fetch_res['shipping_address']."')");
			
			$ac_cash_amt=$fetch_res['cash_amount'];
			if($fetch_res['source']=='')
			{
				$res_dsr = mysqli_query($con,"select * from tbl_dsr where user_id='$tuser_id' and date='$txn_date' and dsr_status != 'Reject'");
				if(mysqli_num_rows($res_dsr)>0 || $ac_cash_amt>0)
				{
					$fetch_dsr_detail=mysqli_fetch_assoc($res_dsr);
					if($fetch_dsr_detail['dsr_status']=='Accept') {
						$dsr_adjustment=mysqli_query($con,"INSERT INTO `tbl_dsr_bill_edit_adjustment`(`transaction_id`, `amount`, `bill_date`, `fse_id`) VALUES ('$billtxn_id','$ac_cash_amt','$txn_date','$tuser_id')");
					}
					else{
						$dsr_adjustment=mysqli_query($con,"update tbl_dsr set dsr_status='Reject',accept_reject_datetime='$scri' where user_id='$tuser_id' and date='$txn_date' and dsr_status='Pending'");
					}
				}
			}
		}
		$update_result = mysqli_query($con,"select * from tbl_party_transaction_detail where transaction_id='$id1'");
		while($fetch_detail=mysqli_fetch_assoc($update_result))
		{
			$ft10=$fetch_detail['IMEI_NO'];
			$feth_pro=$fetch_detail['product_id'];
			$temp_11=$fetch_detail['quantity'];
			$ft20=$fetch_detail['free_qty'];
			$stock_insert1=mysqli_query($con,"INSERT INTO `tbl_bill_edit_detail_audit`( `transaction_id`,`product_id`,`product_name`,`product_price`, `bag_type`,`bag_qty`, `quantity`,`free_qty`,`actual_quantity`,`product_disc`,`CGST_amount`,`SGST_amount`, `IGST_amount`,`cess_pc_amt`, `cess_percentage`, `cess_final_amt`, `gst_perc`, `product_total_amt`, `taxable_amount`, `batch_no`, `expiry_date`, `adjust_stock`, `packing`,`MRP`, `consume_detail`,`barcode`, `dis_type`,`free_flag`, `free_product_id` ) VALUES ('$edit_id1','".$fetch_detail['product_id']."','".$fetch_detail['product_name']."','".$fetch_detail['product_price']."','".$fetch_detail['bag_type']."','".$fetch_detail['bag_qty']."','".$fetch_detail['quantity']."','".$fetch_detail['free_qty']."','".$fetch_detail['actual_quantity']."','".$fetch_detail['product_disc']."','".$fetch_detail['CGST_amount']."','".$fetch_detail['SGST_amount']."','".$fetch_detail['IGST_amount']."','".$fetch_detail['cess_pc_amt']."','".$fetch_detail['cess_percentage']."','".$fetch_detail['cess_final_amt']."','".$fetch_detail['gst_perc']."','".$fetch_detail['product_total_amt']."','".$fetch_detail['taxable_amount']."','".$fetch_detail['batch_no']."','".$fetch_detail['expiry_date']."','".$fetch_detail['adjust_stock']."','".$fetch_detail['packing']."','".$fetch_detail['MRP']."','".$fetch_detail['consume_detail']."','".$fetch_detail['barcode']."','".$fetch_detail['dis_type']."','".$fetch_detail['free_flag']."','".$fetch_detail['free_product_id']."')");
			
			if($txn22=="Yes")
			{
				if($txn48=='')
					$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='0000-00-00', saleout_time='00:00:00',user_id='0' where IMEI ='$ft10' and product_id='$feth_pro' and user_id='$tuser_id'");	
				else
					$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='0000-00-00', saleout_time='00:00:00',user_id='0' where IMEI ='$ft10' and product_id='$feth_pro'");
			}
			else if($ft10!='' && $txn46=='Retail')
			{
				if($txn48=='FSE')
					$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='0000-00-00', saleout_time='00:00:00',,user_id='0' where IMEI ='$ft10' and product_id='$feth_pro' and user_id='$tuser_id'");	
				else
					$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='0000-00-00', saleout_time='00:00:00',user_id='0' where IMEI ='$ft10' and product_id='$feth_pro'");
			}
			
			$txn_date=$invoice_add_date;
			
			$uq_check=mysqli_query($con,"select * from tbl_product where product_id='$feth_pro' and maintain_inventory='Yes'");
			if(mysqli_num_rows($uq_check)>0)
			{
				$res_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date ='$txn_date' and distributor_id='$session_dist_ver' and product_id='$feth_pro' ORDER BY `date` DESC LIMIT 1");
				if(mysqli_num_rows($res_stock)>0)
				{
					$uq21=mysqli_query($con,"update tbl_distributor_stock set closing_stock=round(closing_stock+'$temp_11'+'$ft20',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver' and date ='$txn_date'");
					$uq_21=mysqli_query($con,"update tbl_distributor_stock set closing_stock=round(closing_stock+'$temp_11'+'$ft20',2), opening_stock=round(opening_stock+'$temp_11'+'$ft20',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver' and date>'$txn_date'");
					$uq_22=mysqli_query($con,"update tbl_product set stock_quantity=round(stock_quantity+'$temp_11'+'$ft20',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver'");
				}
				else
				{
					$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$txn_date' and distributor_id='$session_dist_ver' and product_id='$feth_pro' ORDER BY `date` DESC LIMIT 1");
					if(mysqli_num_rows($res_stock1)>0)
					{
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						$stock_quantity=$row_stock1['closing_stock'];
						$temp_quantity=round($stock_quantity+$temp_11+$ft20,2);
						$stock_insert11=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$session_dist_ver','$feth_pro','$stock_quantity','$temp_quantity','$txn_date','$scro')");
						$uq_22=mysqli_query($con,"update tbl_product set stock_quantity=round(stock_quantity+'$temp_11'+'$ft20',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver'");
						$uq_21=mysqli_query($con,"update tbl_distributor_stock set closing_stock=round(closing_stock+'$temp_11'+'$ft20',2), opening_stock=round(opening_stock+'$temp_11'+'$ft20',2) where product_id='$feth_pro' and distributor_id='$session_dist_ver' and date>'$txn_date'");
					}
				}
			}
		}
		if($audit_party_txn)
		{
			$resd2 = mysqli_query($con,"DELETE FROM tbl_party_transaction_detail where transaction_id='$id1'");
			$uq_return=mysqli_query($con,"UPDATE tbl_retailer_returnable_master SET status='Deleted' where txn_id='$id1'");
			if($txn5=='Credit')
			{
				include_once "sale-purchase-balance-effect-class.php";
				$CashCollection=new Collectionbalance();
				$collections=$CashCollection->saleminuscollection($session_dist_ver,$txn18,$txn_date,$txn3);
			}
			
			if(($txn48=="Web" || $txn48=="Admin") && $dist_dsr_require=='Yes')
			{
				include_once "cash_bank_effect_class.php";
				if($txn12>0)
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->purchasecashcollection($session_dist_ver,$txn12,$txn_date);
				}
				else if($txn13>0 && ($txn5=='Online' || $txn5=='Wallet') && $dep_bank_id>0)
				{
					$CashCollection=new Collection();
					$collections=$CashCollection->purchasebankcollection($session_dist_ver,$dep_bank_id,$txn13,$txn_date);
				}
			}
		}
		if($resd2)
		{	
			return 1;
		}
	}
}
?>