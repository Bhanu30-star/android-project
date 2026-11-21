<?php
include("../../connect.php");
$response = array();
if(isset($_POST['txn_id']) && isset($_POST['distributor_id']))
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
	$scri =$da." ".$scro;
	$id1=$_POST['txn_id'];
	$dist_dsr_require=$_POST['dsr_requirement'];
	$txn22='';
	$res = mysqli_query($con,"select * from tbl_party_transaction where transaction_id='$id1'");
	while($fetch_product=mysqli_fetch_assoc($res))
	{
		extract($fetch_product);
		$tuser_id=$fetch_product['transaction_from'];
		$txn_date=$fetch_product['transaction_date'];
		$invoice_add_date=$fetch_product['invoice_add_date'];
		if($invoice_add_date=='0000-00-00')
			$invoice_add_date=$txn_date;
		$txn1=$fetch_product['transaction_bill_number'];
		$txn2=$fetch_product['transaction_time'];
		$txn3=$fetch_product['transaction_to'];
		$txn4=$fetch_product['total_amount'];
		$txn5=$fetch_product['payment_mode'];
		$dep_bank_id=$fetch_product['bank_id'];
		$txn6=$fetch_product['payment_status'];
		$txn7=$fetch_product['bank_name'];
		$txn8=$fetch_product['cheque_no'];
		$txn9=$fetch_product['cheque_date'];
		$txn10=$fetch_product['supply_place'];
		$txn11=$fetch_product['reverse_charge'];
		$txn12=$fetch_product['cash_amount'];
		$txn13=$fetch_product['cheque_amount'];
		$txn14=$fetch_product['invoice_receipt'];
		$txn15=$fetch_product['remark'];
		$txn16=$fetch_product['cash_receipt_date'];
		$txn17=$fetch_product['disc_amt'];
		$txn18=$fetch_product['final_amt'];
		$txn19=$fetch_product['bill_type'];
		$txn20=$fetch_product['cess_amount'];
		$txn21=$fetch_product['round_off_amt'];
		$txn22=$fetch_product['serial_no_bill'];
		$txn23=$fetch_product['credit_days'];
		$txn24=$fetch_product['bill_date'];
		$txn25=$fetch_product['latitude'];
		$txn26=$fetch_product['longitude'];
		$txn27=$fetch_product['courier_facility'];
		$txn28=$fetch_product['courier_no'];
		$txn29=$fetch_product['reference_no'];
		$txn30=$fetch_product['courier_date'];
		$txn31=$fetch_product['courier_company'];
		$txn32=$fetch_product['message_txn_id'];
		$txn33=$fetch_product['consignee_name'];
		$txn34=$fetch_product['transport_company'];
		$txn35=$fetch_product['g_r_no'];
		$txn36=$fetch_product['transport_date'];
		$txn37=$fetch_product['transport_address'];
		$txn40=$fetch_product['labour_charges'];
		$txn41=$fetch_product['freight_charges'];
		$txn42=$fetch_product['other_expenses'];
		$txn38=$fetch_product['party_gstin'];
		$txn39=$fetch_product['tds_amt'];
		$txn43=$fetch_product['online_amt'];
		$txn44=$fetch_product['converted_transaction_id'];
		$txn45=$fetch_product['payment_type'];
		$txn46=$fetch_product['txn_service_type'];
		$txn47=$fetch_product['sign_image'];
		$txn49=$fetch_product['gst_configure'];
		$txn48=$fetch_product['source'];
		$txn50=$fetch_product['autofill_bill'];
		$txn52=$fetch_product['barcode_bill'];
		$txn51=$fetch_product['discount_on_total'];
		$txn53=$fetch_product['reason'];
		$txn58=$fetch_product['gst_invoice_generation'];
		$txn57=$fetch_product['is_tcs'];
		$txn54=$fetch_product['tcs_amount'];
		$txn55=$fetch_product['final_amt_w_tcs'];
		$txn56=$fetch_product['tcs_percentage'];
		$txn59=$fetch_product['operator_detail'];
		if($source=='')
		{
			$stock_add_flag='Admin';
		}
		$stock_insert=mysqli_query($con,"INSERT INTO tbl_bill_cancel(transaction_id,transaction_bill_number,transaction_date,transaction_time,transaction_from,transaction_to, total_amount,payment_mode,payment_status,bank_name,cheque_no,cheque_date,supply_place,reverse_charge,cash_amount,cheque_amount,invoice_receipt,remark,cash_receipt_date,disc_amt,final_amt,bill_type,insert_datetime,action_by,cess_amount,round_off_amt,serial_no_bill,credit_days,bill_date,latitude,longitude,courier_facility,courier_no,reference_no,courier_date,courier_company,message_txn_id,consignee_name,transport_company,g_r_no,transport_date,transport_address,party_gstin,tds_amt,labour_charges,freight_charges,other_expenses,online_amt,converted_transaction_id,payment_type,txn_service_type,sign_image,source,gst_configure,autofill_bill,discount_on_total,barcode_bill,reason,gst_invoice_generation,is_tcs,tcs_amount,final_amt_w_tcs,tcs_percentage,operator_detail,bank_id,stock_add,order_id,invoice_add_date)values('$id1','$txn1','$txn_date','$txn2','$tuser_id','$txn3','$txn4','$txn5','$txn6','$txn7','$txn8','$txn9','$txn10','$txn11','$txn12','$txn13','$txn14','$txn15','$txn16','$txn17','$txn18','$txn19','$scri','$session_dist_ver','$txn20','$txn21','$txn22','$txn23','$txn24','$txn25','$txn26','$txn27','$txn28','$txn29','$txn30','$txn31','$txn32','$txn33','$txn34','$txn35','$txn36','$txn37','$txn38','txn39','$txn40','$txn41','$txn42','$txn43','$txn44','$txn45','$txn46','$txn47','$txn48','$txn49','$txn50','$txn51','$txn52','$txn53','$txn58','$txn57','$txn54','$txn55','$txn56','$txn59','$dep_bank_id','$stock_add_flag','$txn_order_id','$invoice_add_date')");
		$resd_message = mysqli_query($con,"DELETE FROM tbl_retailer_message_detail where transaction_id='$txn32' order by message_id desc limit 1");	
		$autofill_message = mysqli_query($con,"update tbl_autofill_retailer_message_detail set txn_status='Pending' where transaction_id='$txn32' and user_id='$tuser_id' and txn_status='Complete' and status='Transfer' order by message_id desc limit 1");
		$autofill_message1 = mysqli_query($con,"delete from tbl_autofill_retailer_message_detail where transaction_id='$txn32' and user_id='$tuser_id' and status='Bill' order by message_id desc limit 1");	
	}
	
	$update_result = mysqli_query($con,"select * from tbl_party_transaction_detail where transaction_id='$id1'");
	while($fetch_update=mysqli_fetch_assoc($update_result))
	{
		$txn_detail_id=$fetch_update['transaction_detail_id'];
		$feth_pro=$fetch_update['product_id'];
		$temp_11=$fetch_update['quantity'];
		$ft1=$fetch_update['product_name'];
		$ft2=$fetch_update['product_price'];
		$ft3=$fetch_update['quantity'];
		$ft4=$fetch_update['CGST_amount'];
		$ft5=$fetch_update['SGST_amount'];
		$ft11=$fetch_update['IGST_amount'];
		$ft6=$fetch_update['cess_pc_amt'];
		$ft7=$fetch_update['cess_percentage'];
		$ft8=$fetch_update['cess_final_amt'];
		$ft9=$fetch_update['product_disc'];
		$ft10=$fetch_update['IMEI_NO'];
		$ft12=$fetch_update['gst_perc'];
		$ft13=$fetch_update['product_total_amt'];
		$ft14=$fetch_update['taxable_amount'];
		$ft15=mysqli_real_escape_string($con,$fetch_update['batch_no']);
		$ft16=$fetch_update['expiry_date'];
		$ft17=$fetch_update['adjust_stock'];
		$ft18=mysqli_real_escape_string($con,$fetch_update['packing']);
		$ft19=$fetch_update['MRP'];
		$ft20=$fetch_update['free_qty'];
		$ft21=$fetch_update['bag_type'];
		$ft22=$fetch_update['bag_qty'];
		$ft23=$fetch_update['actual_quantity'];
		$ft24=$fetch_update['consume_detail'];
		$ft25=$fetch_update['barcode'];
		$ft26=$fetch_update['dis_type'];
		$ft27=$fetch_update['sale_unit'];
		$stock_insert1=mysqli_query($con,"INSERT INTO `tbl_bill_cancel_detail`(`transaction_id`, `product_id`, `product_name`, `product_price`, `bag_type`, `bag_qty`, `quantity`, `free_qty`, `actual_quantity`, `IMEI_NO`, `product_disc`, `CGST_amount`, `SGST_amount`, `IGST_amount`, `cess_pc_amt`, `cess_percentage`, `cess_final_amt`, `gst_perc`, `product_total_amt`, `taxable_amount`, `batch_no`, `expiry_date`, `adjust_stock`, `packing`, `MRP`, `consume_detail`,`barcode`, `dis_type`,`sale_unit`) VALUES ('$id1','$feth_pro','$ft1','$ft2','$ft21','$ft22','$ft3','$ft20','$ft23','$ft10','$ft9','$ft4','$ft5','$ft11','$ft6','$ft7','$ft8','$ft12','$ft13','$ft14','$ft15','$ft16','$ft17','$ft18','$ft19','$ft24','$ft25', '$ft26','$ft27')");
		$re_txn_detail = mysqli_insert_id($con);
		if($ft15!='')
		{
			$batchdetail=explode(",",$ft15);
			$expirydetail=explode(",",$ft16);
			$adjustdetail=explode(",",$ft17);
			$packingdetail=explode(",",$ft18);
			for($hj=0;$hj<sizeof($batchdetail);$hj++) 
			{
				$myadjustval=floatval($adjustdetail[$hj]);
				$mybatchval=mysqli_real_escape_string($con,$batchdetail[$hj]);
				$mypackingval=mysqli_real_escape_string($con,$packingdetail[$hj]);
				$uq=mysqli_query($con,"UPDATE tbl_distributor_transaction SET batch_qty_adjust=batch_qty_adjust-'$myadjustval' where product_id='$feth_pro' and batch_no='$mybatchval' and expiry_date='".$expirydetail[$hj]."' and packing='$mypackingval' and txn_type='Add'");	
			}
			$uq=mysqli_query($con,"delete from tbl_distributor_transaction where product_id='$feth_pro' and user_id='$tuser_id' and txn_type='Transfer' and quantity='$ft3' and batch_no='$ft15' and expiry_date='$ft16' and packing='$ft18'");
		}
		if($txn22=="Yes")
		{
			if($txn48=='')
				$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='0000-00-00',saleout_time='00:00:00',user_id='0' where IMEI ='$ft10' and product_id='$feth_pro' and user_id='$tuser_id'");	
			else
				$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='0000-00-00',saleout_time='00:00:00',user_id='0' where IMEI ='$ft10' and product_id='$feth_pro'");
		}
		else if($ft10!='' && $txn46=='Retail')
		{
			if($txn48=='FSE')
				$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='0000-00-00',saleout_time='00:00:00',,user_id='0' where IMEI ='$ft10' and product_id='$feth_pro' and user_id='$tuser_id'");	
			else
				$uq=mysqli_query($con,"UPDATE tbl_product_serialno SET status='Available',saleout_date='0000-00-00',saleout_time='00:00:00',user_id='0' where IMEI ='$ft10' and product_id='$feth_pro'");
		}
		$txn_date=$invoice_add_date;
		if($ft24=='Yes')
		{
			$consume_raw_pro_check=mysqli_query($con,"SELECT * FROM tbl_party_transaction_consumable_detail WHERE product_id='$feth_pro' and transaction_detail_id='$txn_detail_id'");
			while($row_fetch_direct = mysqli_fetch_array($consume_raw_pro_check))
			{
				$con_pro_id_val=$row_fetch_direct['consume_product_id'];
				$new_quantity = $row_fetch_direct['total_qty_consume'];
				
				$res_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date ='$txn_date' and distributor_id='$session_dist_ver' and product_id='$con_pro_id_val' ORDER BY `date` DESC LIMIT 1");
				if(mysqli_num_rows($res_stock)>0)
				{
					$row_stock =  mysqli_fetch_assoc($res_stock);
					$stock_quantity=$row_stock['closing_stock'];
					$temp_quantity=round($stock_quantity+$new_quantity,2);
					$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scro' where date ='$txn_date' and distributor_id='$session_dist_ver' and product_id='$con_pro_id_val'");
					$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$con_pro_id_val' and distributor_id='$session_dist_ver'");
					$query_consume=mysqli_query($con,"INSERT INTO `tbl_bill_cancel_consumable_detail`(`transaction_detail_id`, `product_id`, `consume_product_id`, `consume_quantity`, `total_qty_consume`, `txn_date`) VALUES ('$re_txn_detail','$feth_pro','$con_pro_id_val','".$row_fetch_direct['consume_quantity']."','$new_quantity','$txn_date')");
				}
				else
				{
					$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$txn_date' and distributor_id='$session_dist_ver' and product_id='$con_pro_id_val' ORDER BY `date` DESC LIMIT 1");
					if(mysqli_num_rows($res_stock1)>0)
					{
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						$stock_quantity=$row_stock1['closing_stock'];
						$temp_quantity=round($stock_quantity+$new_quantity,2);
						$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$session_dist_ver','$con_pro_id_val','$stock_quantity','$temp_quantity','$txn_date','$scro')");
						$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$con_pro_id_val' and distributor_id='$session_dist_ver'");
						$query_consume=mysqli_query($con,"INSERT INTO `tbl_bill_cancel_consumable_detail`(`transaction_detail_id`, `product_id`, `consume_product_id`, `consume_quantity`, `total_qty_consume`, `txn_date`) VALUES ('$re_txn_detail','$feth_pro','$con_pro_id_val','".$row_fetch_direct['consume_quantity']."','$new_quantity','$txn_date')");
					}
				}
			}
		}
		else
		{
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
	}
	if($stock_insert)
	{
		$resd1 = mysqli_query($con,"DELETE FROM tbl_party_transaction where transaction_id='$id1'");
		$resd2 = mysqli_query($con,"DELETE FROM tbl_party_transaction_detail where transaction_id='$id1'");
		$resd3 = mysqli_query($con,"DELETE FROM gst_reports_jan2018 where distributor_id='$session_dist_ver' and transaction_date='$txn_date' and transaction_bill_number='$txn1'");
		
		if($txn5=='Credit')
		{
			include("sale-purchase-balance-effect-class.php");
			$CashCollection=new Collectionbalance();
			$collections=$CashCollection->saleminuscollection($session_dist_ver,$txn18,$txn_date,$txn3);
		}
		
		if(($txn48=="Web" || $txn48=="Admin") && $dist_dsr_require=='Yes')
		{
			include("cash_bank_effect_class.php");
			if($txn12>0)
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasecashcollection($session_dist_ver,$txn12,$txn_date);
			}
			else if($txn13>0 && $txn5=='Online' && $dep_bank_id>0)
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasebankcollection($session_dist_ver,$dep_bank_id,$txn13,$txn_date);
			}
		}
		else if($txn12>0 || $txn13>0 && $dist_dsr_require=='Yes')
		{
			$res_dsr = mysqli_query($con,"select * from tbl_dsr where user_id='$tuser_id' and date='$da'");
			$fetch_dsr =  mysqli_fetch_assoc($res_dsr);
			if(mysqli_num_rows($res_dsr)>0 && $fetch_dsr['dsr_status']=='Pending')
			{
				$uq_dsr_update=mysqli_query($con,"UPDATE tbl_dsr SET dsr_status='Reject',accept_reject_datetime='$scri',update_by='$session_dist_ver' where user_id='$tuser_id' and date='$da' and dsr_status in ('Pending')");
			}
			else if(mysqli_num_rows($res_dsr)>0 && $fetch_dsr['dsr_status']=='Accept')
			{
				$res_dsr_entry = mysqli_query($con,"INSERT IGNORE INTO tbl_dsr(user_id,cash_detail,cheque_detail,total_amount,date, time,tb_insertdate, tb_inserttime,type,dsr_status)values('$tuser_id','$txn12','$txn13','$txn12+$txn13','$txn_date','$scro','$txn_date','$scro','System Generated Entry','Accept')");
				include("cash_bank_effect_class.php");
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
	}
	if($resd1 && $resd2)
	{	
		$response['success']='1';
		$response['details']="Bill Successfully Cancelled";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}
echo json_encode($response);
 ?>