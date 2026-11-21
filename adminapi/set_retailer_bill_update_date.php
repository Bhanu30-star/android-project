<?php
include("../../connect.php");
$response = array();
if(isset($_POST['new_date']) && isset($_POST['distributor_id']) && isset($_POST['new_bill']) && isset($_POST['party_txnid']))
{
	$session_dist_ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$da_date  = date("Y").'-01-01';
	$da_check_date  = date("Y-m").'-01';
	$scri =$da." ".$scro;
	
	$new_billdate=$_POST['new_date'];
	$new_billno=$_POST['new_bill'];
	$id1=$_POST['party_txnid'];
	
	$res_check_flag = mysqli_query($con,"select transaction_date from tbl_party_transaction where transaction_id='$id1'");
	while($fetch_data_flag=mysqli_fetch_assoc($res_check_flag))
	{
		if($fetch_data_flag['transaction_date']>=$da_check_date)
		{
			$check_1=mysqli_query($con,"SELECT * FROM `tbl_party_transaction` where transaction_id!='$id1' and transaction_date>='$da_date' and transaction_bill_number='$new_billno' and transaction_from in (select user_id from tbl_user where `distributor_id`='$session_dist_ver')");
			if(mysqli_num_rows($check_1)==0)
			{  
				$bill_history_insert=mysqli_query($con,"INSERT INTO `tbl_bill_move_history`(`distributor_id`,`transaction_id`,`insert_date`,`insert_time`) VALUES ('$session_dist_ver','$id1','$da','$scro')");
				$old_bill_date='';
				$bill_source='';
				$key_user_id=0;
				$res = mysqli_query($con,"select * from tbl_party_transaction where transaction_id='$id1'");
				while($fetch_product=mysqli_fetch_assoc($res))
				{
					$bill_pay_mode=$fetch_product['payment_mode'];
					if($bill_pay_mode=='Cash' || $bill_pay_mode=='Both')
						$bill_final_amt=$fetch_product['cash_amount'];
					else if($bill_pay_mode=='Online' || $bill_pay_mode=='Wallet')
						$bill_final_amt=$fetch_product['final_amt'];
					
					
					$bill_source=$fetch_product['source'];
					$old_bill_date=$fetch_product['transaction_date'];
					$key_user_id=$fetch_product['transaction_from'];
					$key_serial_no_bill=$fetch_product['serial_no_bill'];
					$key_bank_id=$fetch_product['bank_id'];
					
					$stock_insert=mysqli_query($con,"INSERT INTO tbl_bill_cancel(transaction_id,transaction_bill_number, transaction_date, transaction_time,transaction_from,transaction_to, total_amount,payment_mode, payment_status, bank_name,cheque_no, cheque_date, supply_place,reverse_charge,cash_amount,cheque_amount, invoice_receipt, remark,cash_receipt_date,disc_amt, final_amt, bill_type, insert_datetime,action_by, cess_amount,round_off_amt,serial_no_bill,credit_days,bill_date,latitude,longitude, courier_facility, courier_no,reference_no,courier_date, courier_company,message_txn_id,consignee_name,transport_company, g_r_no,transport_date, transport_address, party_gstin,tds_amt,labour_charges,freight_charges,other_expenses,online_amt,converted_transaction_id, payment_type, txn_service_type,sign_image,source,gst_configure,autofill_bill, discount_on_total,barcode_bill, reason,is_tcs, tcs_amount,final_amt_w_tcs,tcs_percentage,gst_invoice_generation,bank_id)values('$id1','".$fetch_product['transaction_bill_number']."','".$fetch_product['transaction_date']."','".$fetch_product['transaction_time']."','".$fetch_product['transaction_from']."','".$fetch_product['transaction_to']."','".$fetch_product['total_amount']."','".$fetch_product['payment_mode']."','".$fetch_product['payment_status']."','".$fetch_product['bank_name']."','".$fetch_product['cheque_no']."','".$fetch_product['cheque_date']."','".$fetch_product['supply_place']."','".$fetch_product['reverse_charge']."','".$fetch_product['cash_amount']."','".$fetch_product['cheque_amount']."','".$fetch_product['invoice_receipt']."','".$fetch_product['remark']."','".$fetch_product['cash_receipt_date']."','".$fetch_product['disc_amt']."','".$fetch_product['final_amt']."','".$fetch_product['bill_type']."','".$fetch_product['insert_datetime']."','".$fetch_product['action_by']."','".$fetch_product['cess_amount']."','".$fetch_product['round_off_amt']."','".$fetch_product['serial_no_bill']."','".$fetch_product['credit_days']."','".$fetch_product['bill_date']."','".$fetch_product['latitude']."','".$fetch_product['longitude']."','".$fetch_product['courier_facility']."','".$fetch_product['courier_no']."','".$fetch_product['reference_no']."','".$fetch_product['courier_date']."','".$fetch_product['courier_company']."','".$fetch_product['message_txn_id']."','".$fetch_product['consignee_name']."','".$fetch_product['transport_company']."','".$fetch_product['g_r_no']."','".$fetch_product['transport_date']."','".$fetch_product['transport_address']."','".$fetch_product['party_gstin']."','".$fetch_product['tds_amt']."','".$fetch_product['labour_charges']."','".$fetch_product['freight_charges']."','".$fetch_product['other_expenses']."','".$fetch_product['online_amt']."','".$fetch_product['converted_transaction_id']."','".$fetch_product['payment_type']."','".$fetch_product['txn_service_type']."','".$fetch_product['sign_image']."','".$fetch_product['source']."','".$fetch_product['gst_configure']."','".$fetch_product['autofill_bill']."','".$fetch_product['discount_on_total']."','".$fetch_product['barcode_bill']."','".$fetch_product['reason']."','".$fetch_product['is_tcs']."','".$fetch_product['tcs_amount']."','".$fetch_product['final_amt_w_tcs']."','".$fetch_product['tcs_percentage']."','".$fetch_product['gst_invoice_generation']."','$key_bank_id')");
				}
				$ck_product=0;
				$update_result = mysqli_query($con,"select *,sum(quantity) as t_product_qty from tbl_party_transaction_detail where transaction_id='$id1' group by product_id");
				while($fetch_data=mysqli_fetch_assoc($update_result))
				{
					$ck_product++;
					$feth_pro=$fetch_data['product_id'];
					$temp_11=$fetch_data['t_product_qty'];
					if($key_serial_no_bill=='Yes')
					{
						$update_result_in_detail = mysqli_query($con,"select * from tbl_party_transaction_detail where transaction_id='$id1' and product_id ='$feth_pro'");
						while($fetch_data1=mysqli_fetch_assoc($update_result_in_detail))
						{
							$stock_insert1=mysqli_query($con,"INSERT INTO `tbl_bill_cancel_detail`(`transaction_id`,`product_id`, `product_name`,`product_price`, `bag_type`,`bag_qty`,`quantity`,`free_qty`,`actual_quantity`,`IMEI_NO`, `product_disc`,`CGST_amount`, `SGST_amount`, `IGST_amount`, `cess_pc_amt`, `cess_percentage`, `cess_final_amt`, `gst_perc`, `product_total_amt`, `taxable_amount`, `batch_no`, `expiry_date`, `adjust_stock`, `packing`, `MRP`, `consume_detail`,`barcode`, `dis_type`) VALUES ('$id1','$feth_pro','".$fetch_data1['product_name']."','".$fetch_data1['product_price']."','".$fetch_data1['bag_type']."','".$fetch_data1['bag_qty']."','$temp_11','".$fetch_data1['free_qty']."','".$fetch_data1['actual_quantity']."','".$fetch_data1['IMEI_NO']."','".$fetch_data1['product_disc']."','".$fetch_data1['CGST_amount']."','".$fetch_data1['SGST_amount']."','".$fetch_data1['IGST_amount']."','".$fetch_data1['cess_pc_amt']."','".$fetch_data1['cess_percentage']."','".$fetch_data1['cess_final_amt']."','".$fetch_data1['gst_perc']."','".$fetch_data1['product_total_amt']."','".$fetch_data1['taxable_amount']."','$ft15','".$fetch_data1['expiry_date']."','".$fetch_data1['adjust_stock']."','$ft18','".$fetch_data1['MRP']."','".$fetch_data1['consume_detail']."','".$fetch_data1['barcode']."','".$fetch_data1['dis_type']."')");
						}
					}
					else
					{
						$ft15=mysqli_real_escape_string($con,$fetch_data['batch_no']);
						$ft18=mysqli_real_escape_string($con,$fetch_data['packing']);
						$stock_insert1=mysqli_query($con,"INSERT INTO `tbl_bill_cancel_detail`(`transaction_id`,`product_id`, `product_name`,`product_price`, `bag_type`,`bag_qty`,`quantity`,`free_qty`,`actual_quantity`,`IMEI_NO`, `product_disc`,`CGST_amount`, `SGST_amount`, `IGST_amount`, `cess_pc_amt`, `cess_percentage`, `cess_final_amt`, `gst_perc`, `product_total_amt`, `taxable_amount`, `batch_no`, `expiry_date`, `adjust_stock`, `packing`, `MRP`, `consume_detail`,`barcode`, `dis_type`) VALUES ('$id1','$feth_pro','".$fetch_data['product_name']."','".$fetch_data['product_price']."','".$fetch_data['bag_type']."','".$fetch_data['bag_qty']."','$temp_11','".$fetch_data['free_qty']."','".$fetch_data['actual_quantity']."','".$fetch_data['IMEI_NO']."','".$fetch_data['product_disc']."','".$fetch_data['CGST_amount']."','".$fetch_data['SGST_amount']."','".$fetch_data['IGST_amount']."','".$fetch_data['cess_pc_amt']."','".$fetch_data['cess_percentage']."','".$fetch_data['cess_final_amt']."','".$fetch_data['gst_perc']."','".$fetch_data['product_total_amt']."','".$fetch_data['taxable_amount']."','$ft15','".$fetch_data['expiry_date']."','".$fetch_data['adjust_stock']."','$ft18','".$fetch_data['MRP']."','".$fetch_data['consume_detail']."','".$fetch_data['barcode']."','".$fetch_data['dis_type']."')");
					}
					
					$res_checking = mysqli_query($con,"select maintain_inventory from tbl_product where distributor_id='$session_dist_ver' AND product_id='$feth_pro'");
					$fetch_checking_data=mysqli_fetch_assoc($res_checking);
					$temp_quantity=$temp_11+$fetch_data['free_qty'];
					
					if(($bill_source=='Admin' || $bill_source=='Web') && $old_bill_date!=$new_billdate)
					{
						if($ck_product==1) {
						if($bill_final_amt>0 && ($bill_pay_mode=='Cash' || $bill_pay_mode=='Both'))
						{
							$res_collection_check = mysqli_query($con,"SELECT * FROM tbl_distributor_cash_collection where date <='$new_billdate' and distributor_id='$session_dist_ver' order by date desc limit 1");
							if(mysqli_num_rows($res_collection_check)>0)
							{
								$rows_res_check = mysqli_fetch_assoc($res_collection_check);
								if($rows_res_check['date']!=$new_billdate)
								{
									$query1=mysqli_query($con,"INSERT INTO tbl_distributor_cash_collection(distributor_id,opening_amt, closing_amt, date) VALUES ('$session_dist_ver',".$rows_res_check['closing_amt'].",".$rows_res_check['closing_amt'].",'$new_billdate')");
								}
							}
							else
							{
								$query1 = mysqli_query($con,"INSERT INTO tbl_distributor_cash_collection(distributor_id, opening_amt,closing_amt,date) VALUES ('$session_dist_ver','0','0','$new_billdate')");
							}
							$uq_collection_1=mysqli_query($con,"UPDATE tbl_distributor_cash_collection SET closing_amt=round(closing_amt-'$bill_final_amt',2),time='$scro' where date ='$old_bill_date' and distributor_id='$session_dist_ver'");
							
							$uq_collection_2=mysqli_query($con,"UPDATE tbl_distributor_cash_collection SET closing_amt=round(closing_amt-'$bill_final_amt',2),time='$scro',opening_amt=round(opening_amt-'$bill_final_amt',2) where date >'$old_bill_date' and distributor_id='$session_dist_ver'");
							
							$uq_collection_3=mysqli_query($con,"UPDATE tbl_distributor_cash_collection SET closing_amt=round(closing_amt+'$bill_final_amt',2),time='$scro',opening_amt=round(opening_amt+'$bill_final_amt',2) where date >'$new_billdate' and distributor_id='$session_dist_ver'");
							$uq_collection_4=mysqli_query($con,"UPDATE tbl_distributor_cash_collection SET closing_amt=round(closing_amt+'$bill_final_amt',2),time='$scro' where date ='$new_billdate' and distributor_id='$session_dist_ver'");
						}
						else if($bill_final_amt>0 && ($bill_pay_mode=='Online' || $bill_pay_mode=='Wallet'))
						{
							$res_collection_check = mysqli_query($con,"SELECT * FROM tbl_distributor_cash_collection where date <='$new_billdate' and distributor_id='$session_dist_ver' order by date desc limit 1");
							if(mysqli_num_rows($res_collection_check)>0)
							{
								$rows_res_check = mysqli_fetch_assoc($res_collection_check);
								if($rows_res_check['date']!=$new_billdate)
								{
									$query1 = mysqli_query($con,"INSERT INTO tbl_distributor_bank_collection(distributor_id, opening_amt,closing_amt,date,bank_id) VALUES ('$session_dist_ver',".$rows_res_check['closing_amt'].",".$rows_res_check['closing_amt'].",'$new_billdate','$key_bank_id')");
								}
							}
							else
							{
								$query1 = mysqli_query($con,"INSERT INTO tbl_distributor_bank_collection(distributor_id,opening_amt, closing_amt, date, bank_id) VALUES ('$session_dist_ver','0','0','$new_billdate','$key_bank_id')");
							}
							$uq_collection_3=mysqli_query($con,"UPDATE tbl_distributor_bank_collection SET closing_amt=round(closing_amt-'$bill_final_amt',2),time='$scro' where date ='$old_bill_date' and distributor_id='$session_dist_ver' and bank_id='$key_bank_id'");
							
							$uq_collection_4=mysqli_query($con,"UPDATE tbl_distributor_bank_collection SET closing_amt=round(closing_amt-'$bill_final_amt',2),time='$scro',opening_amt=round(opening_amt-'$bill_final_amt',2) where date >'$old_bill_date' and distributor_id='$session_dist_ver' and bank_id='$key_bank_id'");
							
							$uq_collection_1=mysqli_query($con,"UPDATE tbl_distributor_bank_collection SET closing_amt=round(closing_amt+'$bill_final_amt',2),time='$scro',opening_amt=round(opening_amt+'$bill_final_amt',2) where date >'$new_billdate' and distributor_id='$session_dist_ver' and bank_id='$key_bank_id'");
							
							$uq_collection_2=mysqli_query($con,"UPDATE tbl_distributor_bank_collection SET closing_amt=round(closing_amt+'$bill_final_amt',2),time='$scro' where date ='$new_billdate' and distributor_id='$session_dist_ver' and bank_id='$key_bank_id'");
						}}
						
						if($fetch_checking_data['maintain_inventory']=='Yes')
						{
							$uq_stock_1=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$temp_quantity',2),time='$scro' where date ='$old_bill_date' and distributor_id='$session_dist_ver' and product_id='$feth_pro'");
							$uq_stock_2=mysqli_query($con,"UPDATE tbl_distributor_stock SET opening_stock=round(opening_stock+'$temp_quantity',2),closing_stock=round(closing_stock+'$temp_quantity',2),time='$scro' where date >'$old_bill_date' and distributor_id='$session_dist_ver' and product_id='$feth_pro'");
							if($uq_stock_1 && $uq_stock_2)
							{
								$res_stock = mysqli_query($con,"SELECT * FROM tbl_distributor_stock where date ='$new_billdate' and distributor_id='$session_dist_ver' and product_id='$feth_pro'");
								if(mysqli_num_rows($res_stock)>0)
								{
									$uq_stock_11=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$temp_quantity',2),time='$scro' where date ='$new_billdate' and distributor_id='$session_dist_ver' and product_id='$feth_pro'");
									$uq_stock_21=mysqli_query($con,"UPDATE tbl_distributor_stock SET opening_stock=round(opening_stock-'$temp_quantity',2),closing_stock=round(closing_stock-'$temp_quantity',2),time='$scro' where date >'$new_billdate' and distributor_id='$session_dist_ver' and product_id='$feth_pro'");
								}
								else
								{
									$insert_opening_qty=$insert_closing_qty=0;
									$res_stock1 = mysqli_query($con,"SELECT closing_stock FROM tbl_distributor_stock where date <'$new_billdate' and distributor_id='$session_dist_ver' and product_id='$feth_pro' ORDER BY `date` DESC LIMIT 1");
									if(mysqli_num_rows($res_stock1)>0)
									{
										$row_stock1 =  mysqli_fetch_assoc($res_stock1);
										$insert_opening_qty = $row_stock1['closing_stock'];
									}
									$insert_closing_qty=round($insert_opening_qty-$temp_quantity,2);
									
									$uq_stock_11=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date, time) values ('$session_dist_ver','$feth_pro','$insert_opening_qty','$insert_closing_qty','$new_billdate','$scro')");
									
									$uq_stock_21=mysqli_query($con,"UPDATE tbl_distributor_stock SET opening_stock=round(opening_stock-'$temp_quantity',2),closing_stock=round(closing_stock-'$temp_quantity',2),time='$scro' where date >'$new_billdate' and distributor_id='$session_dist_ver' and product_id='$feth_pro'");
								}
							}
						}
					}
					else
					{
						if($fetch_checking_data['maintain_inventory']=='Yes' && $old_bill_date!=$new_billdate)
						{
							$uq_stock_1=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity+'$temp_quantity',2) where date ='$old_bill_date' and user_id='$key_user_id' and product_id='$feth_pro'");
							$uq_stock_2=mysqli_query($con,"UPDATE tbl_user_stock SET opening_stock=round(opening_stock+'$temp_quantity',2), quantity = round(quantity+'$temp_quantity',2) where date >'$old_bill_date' and user_id='$key_user_id' and product_id='$feth_pro'");
						
							if($uq_stock_1 && $uq_stock_2)
							{
								$res_stock = mysqli_query($con,"SELECT * FROM tbl_user_stock where date ='$new_billdate' and user_id='$key_user_id' and product_id='$feth_pro'");
								if(mysqli_num_rows($res_stock)>0)
								{
									$uq_stock_11=mysqli_query($con,"UPDATE tbl_user_stock SET quantity=round(quantity-'$temp_quantity',2) where date ='$new_billdate' and user_id='$key_user_id' and product_id='$feth_pro'");
									$uq_stock_21=mysqli_query($con,"UPDATE tbl_user_stock SET opening_stock=round(opening_stock-'$temp_quantity',2),quantity=round(quantity-'$temp_quantity',2) where date >'$new_billdate' and user_id='$key_user_id' and product_id='$feth_pro'");
								}
								else
								{
									$insert_opening_qty=$insert_closing_qty=0;
									$res_stock1 = mysqli_query($con,"SELECT * FROM tbl_user_stock where date <'$new_billdate' and user_id='$key_user_id' and product_id='$feth_pro' ORDER BY `date` DESC LIMIT 1");
									if(mysqli_num_rows($res_stock1)>0)
									{
										$row_stock1 =  mysqli_fetch_assoc($res_stock1);
										$insert_opening_qty = $row_stock1['quantity'];
									}
									$insert_closing_qty=round($insert_opening_qty-$temp_quantity,2);
									
									$uq_stock_11=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock,quantity,date) values ('$key_user_id','$feth_pro','$insert_opening_qty','$insert_closing_qty','$new_billdate')");
									
									$uq_stock_21=mysqli_query($con,"UPDATE tbl_user_stock SET opening_stock=round(opening_stock-'$temp_quantity',2),quantity=round(quantity-'$temp_quantity',2) where date >'$new_billdate' and user_id='$key_user_id' and product_id='$feth_pro'");
								}
							}
						}
					}
				}
				if($stock_insert && $stock_insert1)
				{
					$resd1 = mysqli_query($con,"update tbl_party_transaction set transaction_bill_number='$new_billno',transaction_date='$new_billdate',bill_date='$new_billdate',bill_editable='Yes',bill_edit_datetime='$scri',bill_editmove='Yes' where transaction_id='$id1'");
					if($resd1)
					{	
						$response['success']='1';
						$response['details']="Bill Successfully Updated";
					}
					else
					{
						$response['success']='0';
						$response['details']="Something Went Wrong.!!Please Contact to BTHAWK Team.!!";
					}
				}
			
		}
		else
		{
			$response['success']='0';
			$response['details']="Bill No Already Exists";
		}
	}
	else
	{
		$response['success']='0';
		$response['details']="Not Allow To Update";
	}
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}
echo json_encode($response);
 ?>