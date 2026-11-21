<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['total_order']) && isset($_POST['unique_bill']))
{
	$net_amount=0;
	$bill_no = $_POST['unique_bill'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:sa");				
	$cdate  = date("Y-m-d");				     
	$scri =$cdate.' '.$scro;
	$temp_pro_party = $_POST['party_id'];
	$toder = $_POST['total_order'];
	$temp_pro_bill = $_POST['bill_no'];
	$temp_pro_bdate = $_POST['bill_date'];
	$temp_pro_billt = $_POST['bill_time'];
	$pro_purchase_type=$_POST['purchase_type'];
	$pro_message_txn_id=$_POST['message_txn_id'];
	$debit_status="Pending";
	$PurchaseRemark = mysqli_real_escape_string($con,$_POST['remark']);
	$discount_on_total=$_POST["discount_on_total"];
	$temp_explode="";
	$select_order=mysqli_query($con,"select debit_note_sequence from `tbl_sequence` where distributor_id='$ver'");
	$select_row =  mysqli_fetch_assoc($select_order);
	if(mysqli_num_rows($select_order)>0)
	{
		$temp=$select_row['debit_note_sequence'];
		if($temp=="")
		{
			$sd="DN00001";
		}
		else
		{
			$final_invoice=(int)substr($temp,2);
			$final_invoice=$final_invoice+1;
			$final_invoice1=(string)$final_invoice;
			$string_count=5-(int)strlen($final_invoice1);
			for($vb=0;$vb<$string_count;$vb++)
			{
				$temp_explode=$temp_explode."0";
			}
			$sd="DN".$temp_explode.$final_invoice;
		}
		$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET debit_note_sequence='$sd',last_update_datetime='$scri' where distributor_id='$ver'");
	}
	else
	{
		$sd="DN00001";
		$uq_sequence =mysqli_query($con,"insert into tbl_sequence(distributor_id,debit_note_sequence,last_update_datetime)values('$ver','$sd','$scri')");
	}

	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$temp_pro_trans_id=$person_a['trans_id'];
		$temp_pro_id=$person_a['product_id'];
		$temp_bag_type=$person_a['bag_type'];
		$temp_bag_qty=$person_a['bag_qty'];
		$temp_11=$person_a['quantity'];
		$temp_return_cgst=isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '0';
		$temp_return_sgst=isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '0';
		$temp_return_igst=isset($person_a['igst_amt']) ? $person_a['igst_amt'] : '0';
		$temp_return_totamt=$person_a['return_totamt'];
		$cal_dis_amt=$person_a['disc_amount'];
		$cal_final_amt=$person_a['net_amount'];
		$temp_5=isset($person_a['cess_amount']) ? $person_a['cess_amount'] : '0';
		$pro_purchase_price=$person_a['purchase_price'];
		$temp_free=isset($person_a['free_qty']) ? $person_a['free_qty'] : '0';
		$tcs_perc = isset($person_a['tcs_perc']) ? $person_a['tcs_perc'] : '0';
		$tcs_applicable = isset($person_a['tcs_applicable']) ? $person_a['tcs_applicable'] : 'No';
		$tcs_Amt = isset($person_a['tcs_Amt']) ? $person_a['tcs_Amt'] : '0';
		$t_selectimei=$person_a['imei_no'];
		
		$net_amount=$net_amount+$cal_final_amt;
		
		$uploaddata1=trim($t_selectimei);
		$temp_imeino=explode(',',$uploaddata1);
		for($jk=0;$jk<sizeof($temp_imeino);$jk++)
		{
			if($temp_imeino[$jk]!='')
			{
				$res_serialno_detail=mysqli_query($con,"SELECT status FROM tbl_product_serialno where IMEI like '%$temp_imeino[$jk]' and product_id='$temp_pro_id' and status='Available'");
				while($fetch_detail_serialno=mysqli_fetch_assoc($res_serialno_detail))
				{
					$insertQry=mysqli_query($con,"INSERT IGNORE INTO `tbl_purchase_return_serialno`( `product_id`, `IMEI`, `status`, `unique_bill`, `insert_date`, `insert_time`) VALUES ('$temp_pro_id','$temp_imeino[$jk]','".$fetch_detail_serialno['status']."','$bill_no','$cdate','$scro')");
					
				}	
				if($insertQry)
					$resd1 = mysqli_query($con,"DELETE FROM tbl_product_serialno where  IMEI like '%$temp_imeino[$jk]' and unique_bill='$bill_no' and status='Available' and product_id='$temp_pro_id'");
			}
		}
		
		$insert_purchase_trans=mysqli_query($con,"INSERT INTO `tbl_purchase_return_transaction`(`transaction_id`, `product_id`, `distributor_id`, `return_quantity`, `transaction_date`, `transaction_time`, `return_total_amount`, `return_cgst_amt`, `return_sgst_amt`, `party_id`, `bill_no`, `bill_date`,`bill_time`,`unique_bill`,`insert_datetime`,`return_discount`, `return_net_amt`,`return_cess_amt`,`return_igst_amt`,`product_price`,debit_note,debit_note_status,debit_note_receipt,`purchase_type`,`message_txn_id`,`return_free_qty`,`tcs_applicable`,`tcs_perc`,`tcs_Amt`,`bag_type`,`bag_qty`,remark,discount_on_total) VALUES ('$temp_pro_trans_id','$temp_pro_id','$ver','$temp_11','$cdate','$scro','$temp_return_totamt','$temp_return_cgst','$temp_return_sgst','$temp_pro_party','$temp_pro_bill','$temp_pro_bdate','temp_pro_billt','$bill_no','$scri','$cal_dis_amt','$cal_final_amt','$temp_5','$temp_return_igst','$pro_purchase_price','Yes','$debit_status','$sd','$pro_purchase_type','$pro_message_txn_id','$temp_free','$tcs_applicable','$tcs_perc','$tcs_Amt','$temp_bag_type','$temp_bag_qty','$PurchaseRemark','$discount_on_total')");
		if($insert_purchase_trans)
		{
			if($discount_on_total>0)
			{
				$ret_charges_net_amt=$cal_final_amt+$tcs_Amt-$discount_on_total;
				$cal_dis_amt=$cal_dis_amt+$discount_on_total;
				$discount_on_total=0;
			}
			else
			{
				$ret_charges_net_amt=$cal_final_amt+$tcs_Amt;
			}
			$update_c_stock=mysqli_query($con,"UPDATE tbl_distributor_transaction_charges SET return_total_amt = return_total_amt+'$temp_return_totamt', return_tcs_amt = return_tcs_amt+'$tcs_Amt',return_disc_amt=return_disc_amt+'$cal_dis_amt', return_net_amt=return_net_amt+'$ret_charges_net_amt' WHERE unique_bill='$bill_no' and distributor_id='$ver' and party_id='$temp_pro_party'");
			
			$c_stock=0;
			$close_stock=mysqli_query($con,"SELECT * FROM `tbl_distributor_stock` WHERE product_id='$temp_pro_id' and distributor_id='$ver' and date='$cdate'");
			if(mysqli_num_rows($close_stock)>0)
			{
				while($close_fetch=mysqli_fetch_array($close_stock))
				{
					$c_stock=$close_fetch['closing_stock'];
					$dist_stock_id=$close_fetch['distributor_stock_id'];
				}
				$current_cstock=round($c_stock-$temp_11,2);
				$update_c_stock=mysqli_query($con,"UPDATE `tbl_distributor_stock` SET `closing_stock`='$current_cstock' WHERE distributor_stock_id='$dist_stock_id' and product_id='$temp_pro_id' and distributor_id='$ver'");
			}
			else
			{
				$close_stock_new=mysqli_query($con,"SELECT * FROM `tbl_distributor_stock` WHERE product_id='$temp_pro_id' and distributor_id='$ver' ORDER BY date DESC  LIMIT 1"); 
				while($close_fetch_new=mysqli_fetch_array($close_stock_new))
				{ 
					$opening_stock=$close_fetch_new['opening_stock'];
					$c_stock=$close_fetch_new['closing_stock']; 
				} 
				$current_cstock=round($c_stock-$temp_11,2);
				$insert_c_stock=mysqli_query($con,"INSERT INTO `tbl_distributor_stock`(`distributor_id`, `product_id`, `opening_stock`, `closing_stock`, `date`, `time`) VALUES ('$ver','$temp_pro_id','$c_stock','$current_cstock','$cdate','$scro')"); 
			}	 
			
			
			if($temp_free>0)
			{
				$close_stock=mysqli_query($con,"SELECT * FROM `tbl_distributor_free_stock` WHERE product_id='$temp_pro_id' and distributor_id='$ver' and date='$cdate'");
				$count_close_stock=mysqli_num_rows($close_stock);
				if($count_close_stock>0)
				{
					while($close_fetch=mysqli_fetch_array($close_stock))
					{
						$c_stock=$close_fetch['closing_stock'];
						$dist_stock_id=$close_fetch['distributor_stock_id'];
					}
					$current_cstock=round($c_stock-$temp_free,2);
					$update_c_stock=mysqli_query($con,"UPDATE `tbl_distributor_free_stock` SET `closing_stock`='$current_cstock' WHERE distributor_stock_id='$dist_stock_id' and product_id='$temp_pro_id' and distributor_id='$ver'");
				}
				else
				{
					$close_stock_new=mysqli_query($con,"SELECT * FROM `tbl_distributor_free_stock` WHERE product_id='$temp_pro_id' and distributor_id='$ver' ORDER BY date DESC  LIMIT 1"); 
					while($close_fetch_new=mysqli_fetch_array($close_stock_new))
					{ 
						$opening_stock=$close_fetch_new['opening_stock'];
						$c_stock=$close_fetch_new['closing_stock']; 
					} 
					$current_cstock=round($c_stock-$temp_free,2);
					$insert_c_stock=mysqli_query($con,"INSERT IGNORE INTO `tbl_distributor_free_stock`(`distributor_id`, `product_id`, `opening_stock`, `closing_stock`, `date`, `time`) VALUES ('$ver','$temp_pro_id','$c_stock','$current_cstock','$cdate','$scro')");
				}	  
			}
			
			$pro_qty=mysqli_query($con,"SELECT * FROM `tbl_product` WHERE product_id='$temp_pro_id' and distributor_id='$ver'");
			while($pro_qty_fetch=mysqli_fetch_array($pro_qty))
			{
				$pro_qty_temp=$pro_qty_fetch['stock_quantity'];
				$pro_freeqty_temp=$pro_qty_fetch['free_stock'];
			}
			$current_proQty=$pro_qty_temp-$temp_11;
			$current_profreeQty=$pro_freeqty_temp-$temp_free;
			$update_c_stock=mysqli_query($con,"UPDATE `tbl_product` SET `stock_quantity`='$current_proQty',`tb_updatedatetime`='$scri',free_stock='$current_profreeQty' WHERE product_id='$temp_pro_id' and distributor_id='$ver'");
		}	
		
		$res_profit = mysqli_query($con, "SELECT * FROM  tbl_product_profit_daywise where distributor_id='$ver' and product_id='$temp_pro_id' ORDER BY `id` DESC LIMIT 1");
		if (mysqli_num_rows($res_profit) > 0) 
		{
			$row_step =  mysqli_fetch_assoc($res_profit);
			$final_balance_qty=$row_step['balance_qty']-$temp_11;
			$final_avg_price=$row_step['avg_price'];
			$stock_insert = mysqli_query($con, "INSERT INTO `tbl_product_profit_daywise`(`distributor_id`, `product_id`, `qty`, `purchase_price`,`sale_price`,`avg_price`,`balance_qty`,`date`,`time`,`type`) VALUES ('$ver','$temp_pro_id','$temp_11','','$pro_purchase_price','$final_avg_price','$final_balance_qty','$cdate','$scro','Debit Note')");
		}
		
		
		
		
    }
	
	include("sale-purchase-balance-effect-class.php");
	$CashCollection=new Collectionbalance();
	$collections=$CashCollection->purchaseminuscollection($ver,$net_amount,$cdate,$temp_pro_party);
	
	$response['success']='1';
	$response['details']="Purchase Return Successfully";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>