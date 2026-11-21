<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['billno']) && isset($_POST['billdate']) && isset($_POST['total_order']))
{
	$ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$month = date('m');
	if($month > 4)
	{
		$fys = date('Y')."-04-01";
		$fye = date('Y', strtotime('+1 year'))."-03-31";
	}
	else
	{
		$fys = date('Y', strtotime('-1 year'))."-04-01";
		$fye = date('Y')."-03-31";
	}
	$temp_id=1;
	
	$pp_id1=$_POST['party_id'];
	$billno1=strtoupper($_POST['billno']);
	$billdate1=$_POST['billdate'];
	$toder = $_POST['total_order'];
	$actual_billtype=$_POST['billtype_value'];
	$remark = isset($_POST['remark']) ? $_POST['remark'] : '';
	$uniqueId=uniqid().'_'.substr(rand(),1,3);
	$uniqueId1="PR".strtoupper($uniqueId);
	$json_a_check=json_decode($toder, true); 
	$stock_add_cancel="No"; 
	$labouramt = isset($_POST['labouramt']) ? $_POST['labouramt'] : '0';
	$freightamt = isset($_POST['freightamt']) ? $_POST['freightamt'] : '0';
	$otherexpamt = isset($_POST['otherexpamt']) ? $_POST['otherexpamt'] : '0';
	$pmode=$_POST['pmode'];
	$pmtype = isset($_POST['pmtype']) ? $_POST['pmtype'] : '';
	$dist_dsr_require=$_POST['dist_dsr_require'];
	$cheq_bank_id = isset($_POST['cheque_bank_id']) ? $_POST['cheque_bank_id'] : '0';
	$cheque_bank = isset($_POST['cheque_bank']) ? $_POST['cheque_bank'] : '';
	$cheque_number = isset($_POST['cheque_number']) ? $_POST['cheque_number'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : $cdate;
	$pstatus=$_POST['payment_status'];
	$bill_disc_amt = isset($_POST['discount_on_total']) ? $_POST['discount_on_total'] : 0;
	if($bill_disc_amt=='')
		$bill_disc_amt=0;
	$tcs_perc = isset($_POST['tcs_perc']) ? $_POST['tcs_perc'] : '0';
	$total_final_amt = isset($_POST['total_final_amt']) ? $_POST['total_final_amt'] : '0';
	$net_final_amt = isset($_POST['net_final_amt']) ? $_POST['net_final_amt'] : '0';
	
	$tcs_Amt=0;
	$tcs_applicable = $_POST['tcs_applicable'];
    if ($tcs_applicable == "") {
		$tcs_applicable = "No";
    }
	else
	{
		$tcs_Amt = $_POST['tcs_Amt'];
	}
	if($tcs_applicable=='No')
		$tcs_Amt=0;
	$disc_amt = $bill_disc_amt;
	if($_POST['calculate_disc_amt']!='')
		$disc_amt = $disc_amt + $_POST['calculate_disc_amt'];
	
	$res_purcahse_check = mysqli_query($con, "SELECT * FROM tbl_distributor_transaction where distributor_id='$ver' and txn_type='Add' and bill_no='$billno1' and bill_date>='$fys' and bill_date<='$fye'");
	if (mysqli_num_rows($res_purcahse_check)==0) 
	{
		foreach ($json_a_check as $person_a_check)
		{
			$proid=$person_a_check['pid'];
			$pro_type_check=$person_a_check['pro_type_check'];
			if($pro_type_check=="Mobile")
			{
				$temp_explode=$person_a_check['imei_detail'];
				$temp_explode1=explode(",",$temp_explode);
				for($jk=0;$jk<sizeof($temp_explode1);$jk++)
				{
					$res_product_stock = mysqli_query($con,"SELECT * FROM  tbl_product_serialno where IMEI ='$temp_explode1[$jk]' and product_id in (select product_id from tbl_product where distributor_id='$ver')");
					if(mysqli_num_rows($res_product_stock)>0)
						$stock_add_cancel="Yes";
				}
			}
		}
	
		if($stock_add_cancel=="No")
		{
			$res_charges = mysqli_query($con,"INSERT INTO `tbl_distributor_transaction_charges`(`distributor_id`, `party_id`, `bill_no`, `unique_bill`, `bill_date`, `labour_charges`, `freight_charges`, `other_expenses`,`total_amt`, `tcs_amt`, `net_amt`,`tcs_percentage`,`is_tcs`,`disc_amt`) VALUES ('$ver','$pp_id1','$billno1','$uniqueId1','$billdate1','$labouramt','$freightamt','$otherexpamt','$total_final_amt','$tcs_Amt','$net_final_amt','$tcs_perc','$tcs_applicable','$disc_amt')");
			$json_a=json_decode($toder, true);     
			foreach ($json_a as $person_a)
			{
				$proid=$person_a['pid'];
				$pquanity=$person_a['quantity'];
				$proprice=$person_a['purchase_price'];
				$pcgst=$person_a['cgst_amt'];
				$psgst=$person_a['sgst_amt'];
				$pigst=$person_a['igstamt'];
				$pamt=$person_a['total_amount'];
				$p_disc_amt=$person_a['disc_amount'];
				$pfinal_net_amt=$person_a['net_amount'];
				$temp_explode=$person_a['imei_detail'];
				$pro_type_check=$person_a['pro_type_check'];
				$temp_explode1=explode(",",$temp_explode);
				$pay_amt=$person_a['paid_amt'];
				$gst_perc=isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
				$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
				$query = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id, product_id,distributor_id, quantity, transaction_date, transaction_time,txn_type,total_amount,cgst_amt,sgst_amt,igst_amt,party_id,bill_no,bill_date, bill_time, unique_bill, final_net_amt,remark_detail,product_price,discount_amt,payment_mode, payment_status,pay_amount, bank_wallet_name, payment_txn_id,cheque_txn_date,payment_type,gst_perc,bill_type,bank_id)values('$transaction_id','$proid','$ver','$pquanity','$cdate','$scri','Add','$pamt','$pcgst','$psgst','$pigst','$pp_id1','$billno1','$billdate1','$scri','$uniqueId1','$pfinal_net_amt','$remark','$proprice','$p_disc_amt','$pmode','$pstatus','$pay_amt','$cheque_bank','$cheque_number','$cheque_date','$pmtype','$gst_perc','$actual_billtype','$cheq_bank_id')");
				if($pro_type_check=="Mobile")
				{
					for($jk=0;$jk<sizeof($temp_explode1);$jk++)
					{
						$insertQry=mysqli_query($con,"INSERT INTO `tbl_product_serialno`(`product_id`, `IMEI`, `insert_date`, `insert_time`,`status`,`unique_bill`) VALUES ('$proid','$temp_explode1[$jk]','$cdate','$scri','Available','$uniqueId1')");
					}
				}

				$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
				$row_stock =  mysqli_fetch_assoc($res_stock);
				if(mysqli_num_rows($res_stock)>0)
				{
					$stock_quantity=$row_stock['closing_stock'];
					$temp_quantity=$stock_quantity+$pquanity;
					$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$cdate' and distributor_id='$ver' and product_id='$proid'");	
					$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
				}
				else
				{
					$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1";
					$res_stock1 = mysqli_query($con,$query_stock1);
					$row_stock1 =  mysqli_fetch_assoc($res_stock1);
					if(mysqli_num_rows($res_stock1)>0)
					{
						$stock_quantity=$row_stock1['closing_stock'];
						$temp_quantity=$stock_quantity+$pquanity;
						$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
						$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
					}
					else
					{
						$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','0','$pquanity','$cdate','$scri')");
						$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$pquanity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
					}
				}
				
				$res_profit = mysqli_query($con, "SELECT * FROM  tbl_product_profit_daywise where distributor_id='$ver' and product_id='$proid' ORDER BY `id` DESC LIMIT 1");
				if (mysqli_num_rows($res_profit) > 0) 
				{
					$row_step =  mysqli_fetch_assoc($res_profit);
					$total_avg_amt=$row_step['avg_price']*$row_step['balance_qty'];
					$total_avg_amt=$total_avg_amt+($proprice*$pquanity);
					$final_balance_qty=$row_step['balance_qty']+$pquanity;
					$final_avg_price=round($total_avg_amt/$final_balance_qty,2);
					$stock_insert = mysqli_query($con, "INSERT INTO `tbl_product_profit_daywise`(`distributor_id`, `product_id`, `qty`, `purchase_price`,`sale_price`,`avg_price`,`balance_qty`,`profit_loss_per_qty`,`total_profit`,`date`,`time`,`type`) VALUES ('$ver','$proid','$pquanity','$proprice','','$final_avg_price','$final_balance_qty','','','$cdate','$scri','Purchase')");
				}
				else
				{
					$stock_insert=mysqli_query($con,"INSERT INTO `tbl_product_profit_daywise`(`distributor_id`,`product_id`,`qty`, `purchase_price`,`sale_price`,`avg_price`,`balance_qty`,`profit_loss_per_qty`,`total_profit`,`date`,`time`,`type`) VALUES ('$ver','$proid','$pquanity','$proprice','','$proprice','$pquanity','','','$cdate','$scri','Purchase')");
				}
			}
			if($uq1)
			{
				if($pmode=='Credit')
				{
					include("sale-purchase-balance-effect-class.php");
					$CashCollection=new Collectionbalance();
					$collections=$CashCollection->purchasecollection($ver,$net_amount,$net_final_amt,$pp_id1);
				}
				
				if($dist_dsr_require=="Yes")
				{
					include("cash_bank_effect_class.php");
					if($pmode=='Cash')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasecashcollection($ver,$net_final_amt,$cdate);
					}
					else if($pmode=='Online')
					{
						$CashCollection=new Collection();
						$collections=$CashCollection->purchasebankcollection($ver,$cheq_bank_id,$net_final_amt,$cdate);
					}
				}
				$response['success']='1';
				$response['details']="Stock successfully uploaded!";
			}
		}
		else
		{
			$response['success']='1';
			$response['details']="Stock already exists!! Please Check and try again later!!";
		}
	}
	else
	{
		$response['success']=0;
		$response['details']="Purchase Already Added !!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>